import { AppError } from '../../common/errors/app-error.js';
import { Product } from '../products/product.model.js';

export type InventoryLine = {
  productId: string;
  quantity: number;
  name?: string;
};

/**
 * Atomically hold stock for order lines (COD sale or Razorpay pending hold).
 * On failure of any line, releases lines already reserved in this call.
 */
export async function reserveStock(items: InventoryLine[]): Promise<void> {
  const reserved: InventoryLine[] = [];

  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      await releaseStock(reserved);
      throw new AppError(`Invalid quantity for ${item.name ?? item.productId}`, 422);
    }

    const updated = await Product.findOneAndUpdate(
      { _id: item.productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true },
    );

    if (!updated) {
      await releaseStock(reserved);
      throw new AppError(
        `Insufficient stock for ${item.name ?? item.productId}`,
        422,
      );
    }

    reserved.push({ productId: item.productId, quantity, name: item.name });
  }
}

/** Return held stock (call only after pending_payment → cancelled claim succeeds). */
export async function releaseStock(items: InventoryLine[]): Promise<void> {
  await Promise.all(
    items.map((item) => {
      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) return Promise.resolve();
      return Product.updateOne({ _id: item.productId }, { $inc: { stock: quantity } });
    }),
  );
}
