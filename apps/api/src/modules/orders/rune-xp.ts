import { AppError } from '../../common/errors/app-error.js';
import { Product } from '../products/product.model.js';
import { User } from '../auth/user.model.js';
import { Order } from './order.model.js';
import {
  RuneXpEntry,
  orderEarnRef,
  orderReverseRef,
  type RuneXpEntryType,
} from './rune-xp-ledger.model.js';

/** 1 XP per ₹10 of goods (subtotal after coupon, shipping excluded). */
export const RUNE_XP_RUPEES_PER_POINT = 10;
export const RUNE_XP_MIN = 10;
export const RUNE_XP_MAX = 500;
export const BUNDLE_RUNE_XP_BONUS = 25;

const COMPLETED_STATUSES = ['confirmed', 'paid', 'packed', 'shipped', 'delivered'];

type OrderLine = { productId: string; quantity: number };

export function runeXpForGoods(goodsTotal: number, isBundle: boolean): number {
  const base = Math.floor(Math.max(0, goodsTotal) / RUNE_XP_RUPEES_PER_POINT);
  const clamped = Math.min(RUNE_XP_MAX, Math.max(RUNE_XP_MIN, base));
  return clamped + (isBundle ? BUNDLE_RUNE_XP_BONUS : 0);
}

export function goodsTotalOf(subtotal: number, discount: number) {
  return Math.max(0, subtotal - discount);
}

export async function orderIsBundle(items: OrderLine[]): Promise<boolean> {
  if (items.length < 2) return false;
  const ids = [...new Set(items.map((item) => String(item.productId)))];
  const products = await Product.find({ _id: { $in: ids } })
    .select('bundleTag')
    .lean();
  const countByTag = new Map<string, number>();
  for (const product of products) {
    const tag = product.bundleTag?.trim();
    if (!tag) continue;
    countByTag.set(tag, (countByTag.get(tag) ?? 0) + 1);
  }
  for (const count of countByTag.values()) {
    if (count >= 2) return true;
  }
  return false;
}

function isDuplicateKey(error: unknown) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: number }).code === 11000,
  );
}

async function insertEntry(input: {
  userId: string;
  orderId?: string;
  type: RuneXpEntryType;
  amount: number;
  businessRef: string;
}) {
  try {
    await RuneXpEntry.create({
      userId: input.userId,
      orderId: input.orderId,
      type: input.type,
      amount: input.amount,
      businessRef: input.businessRef,
    });
    return 'created' as const;
  } catch (error) {
    if (isDuplicateKey(error)) return 'exists' as const;
    throw error;
  }
}

/** Award Rune XP once per order. A repeat call does not increment again. */
export async function awardOrderRuneXp(input: {
  userId: string | undefined;
  orderId: string;
  goodsTotal: number;
  items: OrderLine[];
}): Promise<number> {
  if (!input.userId) return 0;
  const isBundle = await orderIsBundle(input.items);
  const amount = runeXpForGoods(input.goodsTotal, isBundle);
  const businessRef = orderEarnRef(input.orderId);
  const inserted = await insertEntry({
    userId: input.userId,
    orderId: input.orderId,
    type: 'ORDER_EARN',
    amount,
    businessRef,
  });
  if (inserted === 'exists') {
    const existing = await RuneXpEntry.findOne({ businessRef }).select('amount').lean();
    return Number(existing?.amount ?? amount);
  }
  await User.updateOne({ _id: input.userId }, { $inc: { runeXp: amount } });
  return amount;
}

/**
 * One reversal per order. Called after a full refund is claimed (before the parcel ships).
 * Returns the reversed amount, or 0 when there is nothing to reverse.
 */
export async function reverseOrderRuneXp(orderId: string): Promise<number> {
  const earn = await RuneXpEntry.findOne({ businessRef: orderEarnRef(orderId) }).lean();
  if (!earn) return 0;
  const inserted = await insertEntry({
    userId: String(earn.userId),
    orderId,
    type: 'ORDER_REVERSE',
    amount: earn.amount,
    businessRef: orderReverseRef(orderId),
  });
  if (inserted === 'created') {
    await User.updateOne({ _id: earn.userId }, { $inc: { runeXp: -earn.amount } });
  }
  return earn.amount;
}

function signedAmount(type: RuneXpEntryType, amount: number, voided?: boolean) {
  if (voided) return 0;
  if (type === 'ORDER_REVERSE' || type === 'REDEEM') return -amount;
  return amount;
}

export async function ledgerBalance(userId: string): Promise<number> {
  const entries = await RuneXpEntry.find({ userId }).select('type amount voided').lean();
  return entries.reduce((sum, entry) => sum + signedAmount(entry.type, entry.amount, entry.voided), 0);
}

/**
 * Spend XP once per businessRef. A repeat call does not spend again.
 * A voided row is removed so the same key can be retried after a failed grant.
 */
export async function spendRuneXp(input: {
  userId: string;
  amount: number;
  businessRef: string;
}): Promise<'created' | 'replay'> {
  const existing = await RuneXpEntry.findOne({ businessRef: input.businessRef }).lean();
  if (existing && !existing.voided) return 'replay';
  if (existing?.voided) {
    await RuneXpEntry.deleteOne({ _id: existing._id, voided: true });
  }

  const balance = await ledgerBalance(input.userId);
  if (balance < input.amount) {
    throw new AppError('Not enough Rune XP', 422);
  }

  const inserted = await insertEntry({
    userId: input.userId,
    type: 'REDEEM',
    amount: input.amount,
    businessRef: input.businessRef,
  });
  if (inserted === 'exists') return 'replay';

  const updated = await User.findOneAndUpdate(
    { _id: input.userId, runeXp: { $gte: input.amount } },
    { $inc: { runeXp: -input.amount } },
    { new: true },
  );
  const sum = await ledgerBalance(input.userId);
  if (sum < 0) {
    await RuneXpEntry.updateOne({ businessRef: input.businessRef }, { $set: { voided: true } });
    const restored = await ledgerBalance(input.userId);
    await User.updateOne({ _id: input.userId }, { $set: { runeXp: Math.max(0, restored) } });
    throw new AppError('Not enough Rune XP', 422);
  }
  if (!updated) {
    await User.updateOne({ _id: input.userId }, { $set: { runeXp: Math.max(0, sum) } });
  }
  return 'created';
}

/** Roll back a redeem that did not grant its perk, and restore the cached balance. */
export async function voidRuneSpend(userId: string, businessRef: string) {
  await RuneXpEntry.updateOne(
    { businessRef, type: 'REDEEM' },
    { $set: { voided: true } },
  );
  const sum = await ledgerBalance(userId);
  await User.updateOne({ _id: userId }, { $set: { runeXp: Math.max(0, sum) } });
}

/** Insert missing earn rows for older paid orders, then return the ledger sum. */
export async function syncUserRuneXp(userId: string): Promise<number> {
  const orders = await Order.find({
    userId,
    status: { $in: COMPLETED_STATUSES },
  })
    .select('items subtotal discount runeXpAwarded')
    .lean();

  const existing = await RuneXpEntry.find({ userId, type: 'ORDER_EARN' }).select('businessRef').lean();
  const have = new Set(existing.map((entry) => entry.businessRef));

  for (const order of orders) {
    const orderId = String(order._id);
    const ref = orderEarnRef(orderId);
    if (have.has(ref)) continue;
    const stored = Number(order.runeXpAwarded ?? 0);
    const amount =
      stored > 0
        ? stored
        : runeXpForGoods(
            goodsTotalOf(order.subtotal, order.discount ?? 0),
            await orderIsBundle(
              order.items.map((item) => ({
                productId: String(item.productId),
                quantity: item.quantity,
              })),
            ),
          );
    await insertEntry({
      userId,
      orderId,
      type: 'ORDER_EARN',
      amount,
      businessRef: ref,
    });
  }

  return ledgerBalance(userId);
}
