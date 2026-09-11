import { Product } from '../products/product.model.js';
import { User } from '../auth/user.model.js';

export const ORDER_RUNE_XP = 100;
export const BUNDLE_ORDER_RUNE_XP = 500;

type OrderLine = { productId: string; quantity: number };

/**
 * Bundle order = 2+ distinct products that share the same `bundleTag`
 * (e.g. “Complete the bundle” checkout).
 */
export async function computeOrderRuneXp(items: OrderLine[]): Promise<number> {
  if (items.length === 0) return 0;
  const ids = [...new Set(items.map((item) => String(item.productId)))];
  const products = await Product.find({ _id: { $in: ids } })
    .select('_id bundleTag')
    .lean();

  const countByTag = new Map<string, number>();
  for (const product of products) {
    const tag = product.bundleTag?.trim();
    if (!tag) continue;
    countByTag.set(tag, (countByTag.get(tag) ?? 0) + 1);
  }
  for (const count of countByTag.values()) {
    if (count >= 2) return BUNDLE_ORDER_RUNE_XP;
  }
  return ORDER_RUNE_XP;
}

/** Award Rune XP for a completed order (COD confirm or Razorpay paid). */
export async function awardOrderRuneXp(
  userId: string | undefined,
  items: OrderLine[],
): Promise<number> {
  if (!userId || items.length === 0) return 0;

  const awarded = await computeOrderRuneXp(items);
  if (awarded <= 0) return 0;

  await User.updateOne({ _id: userId }, { $inc: { runeXp: awarded } });
  return awarded;
}
