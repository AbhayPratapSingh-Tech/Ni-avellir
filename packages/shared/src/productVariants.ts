import type { Product, ProductCategory, ProductVariant } from './types/index.js';

export const APPAREL_SIZE_ORDER = ['S', 'M', 'L', 'XL'] as const;
export type ApparelSize = (typeof APPAREL_SIZE_ORDER)[number];

/** Deterministic weights so M/L get more units than S/XL. */
const SIZE_WEIGHTS: Record<ApparelSize, number> = {
  S: 1,
  M: 2,
  L: 2,
  XL: 1,
};

export function cartLineKey(productId: string, variantId?: string | null): string {
  return `${productId}::${variantId ?? ''}`;
}

export function productHasVariants(
  product: Pick<Product, 'variants'> | { variants?: ProductVariant[] | null },
): boolean {
  return Array.isArray(product.variants) && product.variants.length > 0;
}

export function requiresVariantSelection(
  product: Pick<Product, 'variants'> | { variants?: ProductVariant[] | null },
): boolean {
  return productHasVariants(product);
}

export function findVariant(
  product: Pick<Product, 'variants'> | { variants?: ProductVariant[] | null },
  variantId?: string | null,
): ProductVariant | undefined {
  if (!variantId || !product.variants?.length) return undefined;
  return product.variants.find((variant) => variant.id === variantId);
}

export function productAvailableStock(
  product: Pick<Product, 'stock' | 'variants'> | { stock: number; variants?: ProductVariant[] | null },
  variantId?: string | null,
): number {
  if (variantId) {
    return Math.max(0, findVariant(product, variantId)?.stock ?? 0);
  }
  if (productHasVariants(product)) {
    return Math.max(
      0,
      product.variants!.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock) || 0), 0),
    );
  }
  return Math.max(0, Number(product.stock) || 0);
}

export function sumVariantStock(variants: ProductVariant[]): number {
  return variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock) || 0), 0);
}

export function shouldHaveSizeVariants(
  category: ProductCategory,
  tags: string[] = [],
  name = '',
): boolean {
  if (category === 'apparel') return true;
  const blob = `${name} ${tags.join(' ')}`.toLowerCase();
  return (
    category === 'limited-drops' &&
    (/tee|t-shirt|hoodie|crew|jersey|shorts|cap|beanie|hat|shirt/.test(blob) ||
      tags.some((tag) => /tee|hoodie|jersey|fashion|apparel/.test(String(tag).toLowerCase())))
  );
}

/**
 * Split a product-level stock count across S/M/L/XL.
 * Idempotent ids: `${productId}-size-{s|m|l|xl}`.
 */
export function buildSizeVariants(options: {
  productId: string;
  stock: number;
  color?: string;
  skuBase?: string;
}): ProductVariant[] {
  const total = Math.max(0, Math.floor(Number(options.stock) || 0));
  const weightSum = APPAREL_SIZE_ORDER.reduce((sum, size) => sum + SIZE_WEIGHTS[size], 0);
  let assigned = 0;
  const variants: ProductVariant[] = APPAREL_SIZE_ORDER.map((size, index) => {
    const isLast = index === APPAREL_SIZE_ORDER.length - 1;
    const raw = Math.floor((total * SIZE_WEIGHTS[size]) / weightSum);
    const stock = isLast ? Math.max(0, total - assigned) : raw;
    assigned += stock;
    const id = `${options.productId}-size-${size.toLowerCase()}`;
    return {
      id,
      size,
      ...(options.color ? { color: options.color } : {}),
      ...(options.skuBase
        ? { sku: `${options.skuBase}-${size.toLowerCase()}` }
        : {}),
      stock,
    };
  });
  return variants;
}

/** Ensure apparel-like products expose size variants; sync top-level stock to the sum. */
export function withApparelVariants(product: Product): Product {
  if (productHasVariants(product)) {
    return {
      ...product,
      stock: sumVariantStock(product.variants!),
    };
  }
  if (!shouldHaveSizeVariants(product.category, product.tags, product.name)) {
    return product;
  }
  const color =
    product.specifications?.Colorway ||
    product.specifications?.Color ||
    product.specifications?.colour;
  const variants = buildSizeVariants({
    productId: product.id,
    stock: product.stock,
    color: color || undefined,
    skuBase: product.sku,
  });
  return {
    ...product,
    variants,
    stock: sumVariantStock(variants),
  };
}
