import { nanoid } from 'nanoid';
import { AppError } from '../../common/errors/app-error.js';
import { User } from '../auth/user.model.js';
import { Coupon } from '../coupons/coupon.model.js';
import { notificationService } from '../notifications/notification.service.js';
import { Product } from '../products/product.model.js';
import { serviceabilityService } from '../serviceability/serviceability.service.js';
import { releaseStock, reserveStock } from './inventory.js';
import { sendOrderStatusEmail } from './order-email.js';
import { Order } from './order.model.js';
import { awardOrderRuneXp, reverseOrderRuneXp } from './rune-xp.js';

export type CreateOrderInput = {
  customer: { name: string; email: string; phone: string };
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  paymentMethod: string;
  discount?: number;
  couponCode?: string;
  /** Optional body fallback; prefer Idempotency-Key header. */
  idempotencyKey?: string;
};

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: number }).code === 11000,
  );
}

const REFUNDABLE_STATUSES = ['paid', 'confirmed', 'packed', 'processing'];

export type OnlineRefundResult = {
  providerRefundId: string;
  amount: number;
};

async function undoCheckoutHolds(input: {
  items: Array<{ productId: string; quantity: number }>;
  userId?: string;
  claimedCouponId?: string;
  consumedShippingCredit: boolean;
}) {
  await releaseStock(input.items);
  if (input.claimedCouponId) {
    await Coupon.updateOne(
      { _id: input.claimedCouponId, usedCount: { $gt: 0 } },
      { $inc: { usedCount: -1 } },
    );
  }
  if (input.consumedShippingCredit && input.userId) {
    await User.updateOne({ _id: input.userId }, { $inc: { freeShippingCredits: 1 } });
  }
}

/** Claim a full refund once, restore unshipped stock, and reverse XP once. */
export async function applyFullRefund(input: {
  orderId: string;
  userId?: string;
  reason?: string;
  providerRefundId?: string;
  amount: number;
  nextStatus: 'cancelled' | 'refunded';
}) {
  const order = await Order.findById(input.orderId);
  if (!order) throw new AppError('Order not found', 404);
  if (input.userId && order.userId && String(order.userId) !== input.userId) {
    throw new AppError('Forbidden', 403);
  }
  if (order.refund?.status === 'processed' || order.status === 'refunded') {
    return { order, reversedXp: 0, already: true, skipped: false };
  }
  if (!REFUNDABLE_STATUSES.includes(order.status)) {
    return { order, reversedXp: 0, already: false, skipped: true };
  }

  const claimed = await Order.findOneAndUpdate(
    { _id: input.orderId, status: { $in: REFUNDABLE_STATUSES } },
    {
      $set: {
        status: input.nextStatus,
        cancelReason: input.reason,
        refund: {
          status: 'processed',
          providerRefundId: input.providerRefundId,
          amount: input.amount,
          processedAt: new Date(),
        },
      },
    },
    { new: true },
  );
  if (!claimed) {
    const current = await Order.findById(input.orderId);
    if (current && (current.refund?.status === 'processed' || current.status === 'refunded')) {
      return { order: current, reversedXp: 0, already: true, skipped: false };
    }
    throw new AppError('Order cannot be cancelled', 422);
  }

  await releaseStock(
    claimed.items.map((item) => ({
      productId: String(item.productId),
      quantity: item.quantity,
    })),
  );
  const reversedXp = await reverseOrderRuneXp(String(claimed._id));
  if (claimed.userId) {
    await notificationService.notifyOrderEvent(
      String(claimed.userId),
      input.nextStatus === 'refunded' ? 'refund' : 'cancelled',
      claimed.orderNumber,
    );
  }
  try {
    await sendOrderStatusEmail({
      to: claimed.customer.email,
      orderNumber: claimed.orderNumber,
      status: input.nextStatus,
      total: claimed.total,
    });
  } catch {
    // email failure must not undo a refund that already settled
  }
  return { order: claimed, reversedXp, already: false, skipped: false };
}

type LeanOrderProduct = {
  _id: unknown;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
};

async function notifyCancelled(order: {
  userId?: unknown;
  orderNumber: string;
  customer: { email: string };
  total: number;
}) {
  if (order.userId) {
    await notificationService.notifyOrderEvent(
      String(order.userId),
      'cancelled',
      order.orderNumber,
    );
  }
  try {
    await sendOrderStatusEmail({
      to: order.customer.email,
      orderNumber: order.orderNumber,
      status: 'cancelled',
      total: order.total,
    });
  } catch {
    // ignore
  }
}

export class OrderService {
  async create(input: CreateOrderInput, userId?: string, idempotencyKey?: string) {
    const key = (idempotencyKey ?? input.idempotencyKey)?.trim() || undefined;

    if (key) {
      const existing = await Order.findOne({ idempotencyKey: key });
      if (existing) {
        if (userId && existing.userId && String(existing.userId) !== userId) {
          throw new AppError('Idempotency key already used by another account', 409);
        }
        return {
          order: existing,
          awardedXp: Number(existing.runeXpAwarded ?? 0),
          replayed: true as const,
        };
      }
    }

    const productIds = input.items.map((item) => item.productId);
    const products = (await Product.find({ _id: { $in: productIds } }).lean()) as LeanOrderProduct[];
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    const items = input.items.map((item) => {
      const product = productMap.get(String(item.productId));
      if (!product) {
        throw new AppError(`Product not found: ${item.productId}`, 404);
      }
      return {
        productId: String(product._id),
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        imageUrl: product.imageUrl,
        lineTotal: product.price * item.quantity,
      };
    });

    // Atomic hold before create (COD sale or Razorpay pending). Idempotent replay skips this.
    await reserveStock(
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        name: item.name,
      })),
    );

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const stockLines = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    let discount = input.discount ?? 0;
    let claimedCouponId: string | undefined;
    let consumedShippingCredit = false;

    if (input.couponCode && userId) {
      const personal = await Coupon.findOne({
        code: input.couponCode.trim().toUpperCase(),
        active: true,
      });
      if (personal && (personal.userIds?.length ?? 0) > 0) {
        if (!personal.userIds.includes(userId)) {
          await releaseStock(stockLines);
          throw new AppError('Coupon not valid for this user', 403);
        }
        if (personal.expiresAt && personal.expiresAt.getTime() < Date.now()) {
          await releaseStock(stockLines);
          throw new AppError('Coupon expired', 422);
        }
        if (personal.minOrderValue && subtotal < personal.minOrderValue) {
          await releaseStock(stockLines);
          throw new AppError(`Minimum order value is ₹${personal.minOrderValue}`, 422);
        }
        const claimedCoupon = await Coupon.findOneAndUpdate(
          { _id: personal._id, active: true, usedCount: { $lt: personal.usageLimit } },
          { $inc: { usedCount: 1 } },
        );
        if (!claimedCoupon) {
          await releaseStock(stockLines);
          throw new AppError('Coupon usage limit reached', 422);
        }
        claimedCouponId = String(personal._id);
        const serverDiscount =
          personal.discountType === 'percent'
            ? Math.min(
                Math.round((subtotal * personal.discountValue) / 100),
                personal.maxDiscount ?? Number.POSITIVE_INFINITY,
              )
            : personal.discountValue;
        discount = Math.min(serverDiscount, subtotal);
      }
    }

    const serviceability = await serviceabilityService.resolve(input.shippingAddress.postalCode);
    const afterDiscount = Math.max(0, subtotal - discount);
    let shipping =
      afterDiscount >= serviceability.freeShippingThreshold ? 0 : serviceability.shippingCharge;
    if (shipping > 0 && userId) {
      const taken = await User.findOneAndUpdate(
        { _id: userId, freeShippingCredits: { $gte: 1 } },
        { $inc: { freeShippingCredits: -1 } },
      );
      if (taken) {
        shipping = 0;
        consumedShippingCredit = true;
      }
    }
    const tax = Math.round(afterDiscount * 0.05);
    const total = afterDiscount + shipping + tax;

    const orderNumber = `ORD-${nanoid(8).toUpperCase()}`;
    const estimatedDelivery = new Date(Date.now() + serviceability.etaDays * 86400000)
      .toISOString()
      .slice(0, 10);

    const isCod = input.paymentMethod === 'cash_on_delivery';
    const payload = {
      userId,
      orderNumber,
      customer: input.customer,
      items,
      shippingAddress: input.shippingAddress,
      paymentMethod: input.paymentMethod,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      currency: 'INR',
      status: isCod ? 'confirmed' : 'pending_payment',
      estimatedDelivery,
      idempotencyKey: key,
      runeXpAwarded: 0,
    };

    let order;
    try {
      order = await Order.create(payload);
    } catch (error) {
      await undoCheckoutHolds({
        items: stockLines,
        userId,
        claimedCouponId,
        consumedShippingCredit,
      });
      if (key && isDuplicateKeyError(error)) {
        const existing = await Order.findOne({ idempotencyKey: key });
        if (existing) {
          return {
            order: existing,
            awardedXp: Number(existing.runeXpAwarded ?? 0),
            replayed: true as const,
          };
        }
      }
      throw error;
    }

    if (userId) {
      await notificationService.notifyOrderEvent(String(userId), 'order_placed', orderNumber);
    }
    try {
      await sendOrderStatusEmail({
        to: input.customer.email,
        orderNumber,
        status: order.status,
        total,
      });
    } catch {
      // email failure must not block checkout
    }

    let awardedXp = 0;
    if (isCod) {
      awardedXp = await awardOrderRuneXp({
        userId,
        orderId: String(order._id),
        goodsTotal: afterDiscount,
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      });
      order.runeXpAwarded = awardedXp;
      await order.save();
    }

    return { order, awardedXp, replayed: false as const };
  }

  async list(userId: string) {
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }
    return Order.find({
      userId,
      // Abandoned Razorpay checkouts stay pending_payment — hide from My Orders.
      status: { $nin: ['pending_payment'] },
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  async getById(id: string, userId: string) {
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }
    const order = await Order.findById(id).lean();
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    if (!order.userId || String(order.userId) !== userId) {
      throw new AppError('Forbidden', 403);
    }
    return order;
  }

  async cancel(
    id: string,
    userId: string | undefined,
    reason?: string,
    refundOnline?: (orderId: string) => Promise<OnlineRefundResult>,
  ) {
    const order = await Order.findById(id);
    if (!order) throw new AppError('Order not found', 404);
    if (userId && String(order.userId) !== userId) {
      throw new AppError('Forbidden', 403);
    }
    if (order.refund?.status === 'processed' || order.status === 'refunded') {
      return { order, reversedXp: 0 };
    }
    if (['cancelled', 'delivered', 'shipped'].includes(order.status)) {
      throw new AppError('Order cannot be cancelled', 422);
    }

    // Unpaid hold: no XP was awarded. Release stock once. Do not call Razorpay.
    if (order.status === 'pending_payment') {
      const claimed = await Order.findOneAndUpdate(
        { _id: id, status: 'pending_payment' },
        { $set: { status: 'cancelled', cancelReason: reason ?? 'user_cancelled' } },
        { new: true },
      );
      if (!claimed) {
        throw new AppError('Order cannot be cancelled', 422);
      }
      await releaseStock(
        claimed.items.map((item) => ({
          productId: String(item.productId),
          quantity: item.quantity,
        })),
      );
      await notifyCancelled(claimed);
      return { order: claimed, reversedXp: 0 };
    }

    if (!REFUNDABLE_STATUSES.includes(order.status)) {
      throw new AppError('Order cannot be cancelled', 422);
    }

    const note = reason ?? 'user_cancelled';
    if (order.paymentMethod !== 'cash_on_delivery') {
      const locked = await Order.findOneAndUpdate(
        {
          _id: id,
          status: { $in: REFUNDABLE_STATUSES },
          $or: [
            { refund: { $exists: false } },
            { 'refund.status': { $nin: ['pending', 'processed'] } },
          ],
        },
        { $set: { 'refund.status': 'pending' } },
        { new: true },
      );
      if (!locked) {
        const current = await Order.findById(id);
        if (current?.refund?.status === 'processed' || current?.status === 'refunded') {
          return { order: current!, reversedXp: 0 };
        }
        const pendingAge = current?.updatedAt
          ? Date.now() - new Date(current.updatedAt).getTime()
          : 0;
        if (current?.refund?.status === 'pending' && pendingAge < 30_000) {
          throw new AppError('Refund already in progress', 409);
        }
        if (current?.refund?.status !== 'pending') {
          throw new AppError('Order cannot be cancelled', 422);
        }
      }
      if (!refundOnline) {
        await Order.updateOne({ _id: id, 'refund.status': 'pending' }, { $unset: { refund: 1 } });
        throw new AppError('Refund is unavailable', 500);
      }
      let online: OnlineRefundResult;
      try {
        online = await refundOnline(id);
      } catch (error) {
        await Order.updateOne(
          { _id: id, status: { $in: REFUNDABLE_STATUSES }, 'refund.status': 'pending' },
          { $unset: { refund: 1 } },
        );
        throw error;
      }
      const settled = await applyFullRefund({
        orderId: id,
        userId,
        reason: note,
        providerRefundId: online.providerRefundId,
        amount: online.amount,
        nextStatus: 'refunded',
      });
      if (settled.skipped) throw new AppError('Order cannot be cancelled', 422);
      return { order: settled.order, reversedXp: settled.reversedXp };
    }

    const settled = await applyFullRefund({
      orderId: id,
      userId,
      reason: note,
      amount: 0,
      nextStatus: 'cancelled',
    });
    if (settled.skipped) throw new AppError('Order cannot be cancelled', 422);
    return { order: settled.order, reversedXp: settled.reversedXp };
  }

  async requestReturn(id: string, userId: string | undefined, reason: string) {
    const order = await Order.findById(id);
    if (!order) throw new AppError('Order not found', 404);
    if (userId && String(order.userId) !== userId) throw new AppError('Forbidden', 403);
    order.returnRequest = { reason, status: 'requested', requestedAt: new Date() };
    await order.save();
    return order;
  }

  async requestExchange(id: string, userId: string | undefined, reason: string) {
    const order = await Order.findById(id);
    if (!order) throw new AppError('Order not found', 404);
    if (userId && String(order.userId) !== userId) throw new AppError('Forbidden', 403);
    order.exchangeRequest = { reason, status: 'requested', requestedAt: new Date() };
    await order.save();
    return order;
  }
}
