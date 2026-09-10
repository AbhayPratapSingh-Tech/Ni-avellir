import { Product } from '../products/product.model.js';
import { User } from '../auth/user.model.js';

/** Award Rune XP for purchased line items (COD confirm or Razorpay paid). */
export async function awardOrderRuneXp(
  userId: string | undefined,
  items: Array<{ productId: string; quantity: number }>,
): Promise<number> {
  if (!userId || items.length === 0) return 0;

  const ids = items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: ids } })
    .select('_id runeXp')
    .lean();
  const xpById = new Map(products.map((p) => [String(p._id), Number(p.runeXp ?? 10)]));

  let awarded = 0;
  for (const item of items) {
    awarded += (xpById.get(String(item.productId)) ?? 10) * item.quantity;
  }
  if (awarded <= 0) return 0;

  await User.updateOne({ _id: userId }, { $inc: { runeXp: awarded } });
  return awarded;
}
