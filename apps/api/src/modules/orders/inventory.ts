import { findVariant, productHasVariants } from '@nidavellir/shared';
import { AppError } from '../../common/errors/app-error.js';
import { Product } from '../products/product.model.js';

export type InventoryLine = {
  productId: string;
  variantId?: string;
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

    const product = await Product.findById(item.productId).lean();
    if (!product) {
      await releaseStock(reserved);
      throw new AppError(`Product not found: ${item.productId}`, 404);
    }

    const hasVariants = productHasVariants(product);
    if (hasVariants && !item.variantId) {
      await releaseStock(reserved);
      throw new AppError(`Select a size for ${item.name ?? product.name}`, 422);
    }
    if (!hasVariants && item.variantId) {
      await releaseStock(reserved);
      throw new AppError(`Unknown variant for ${item.name ?? product.name}`, 422);
    }

    let updated = null;
    if (item.variantId) {
      const variant = findVariant(product, item.variantId);
      if (!variant) {
        await releaseStock(reserved);
        throw new AppError(`Variant not found for ${item.name ?? product.name}`, 422);
      }
      updated = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          variants: {
            $elemMatch: { id: item.variantId, stock: { $gte: quantity } },
          },
        },
        {
          $inc: {
            'variants.$[v].stock': -quantity,
            stock: -quantity,
          },
        },
        {
          new: true,
          arrayFilters: [{ 'v.id': item.variantId }],
        },
      );
    } else {
      updated = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true },
      );
    }

    if (!updated) {
      await releaseStock(reserved);
      throw new AppError(
        `Insufficient stock for ${item.name ?? item.productId}`,
        422,
      );
    }

    reserved.push({
      productId: item.productId,
      variantId: item.variantId,
      quantity,
      name: item.name,
    });
  }
}

/** Return held stock once, after a status claim: unpaid cancel/expiry, or a full refund before ship. */
export async function releaseStock(items: InventoryLine[]): Promise<void> {
  await Promise.all(
    items.map((item) => {
      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) return Promise.resolve();
      if (item.variantId) {
        return Product.updateOne(
          { _id: item.productId, 'variants.id': item.variantId },
          {
            $inc: {
              'variants.$[v].stock': quantity,
              stock: quantity,
            },
          },
          { arrayFilters: [{ 'v.id': item.variantId }] },
        );
      }
      return Product.updateOne({ _id: item.productId }, { $inc: { stock: quantity } });
    }),
  );
}

export function assertVariantForCheckout(
  product: { name?: string; variants?: Array<{ id: string; stock?: number }> | null },
  variantId?: string,
): void {
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  if (hasVariants && !variantId) {
    throw new AppError(`Select a size for ${product.name ?? 'this product'}`, 422);
  }
}
