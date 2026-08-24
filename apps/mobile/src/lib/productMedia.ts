import type { Product } from '@nidavellir/shared';

type ProductLike = Product & { galleryUrls?: string[] };

export function getProductImages(product: Product): string[] {
  const raw = product as ProductLike;
  if (raw.imageUrls?.length) {
    return raw.imageUrls;
  }
  if (raw.galleryUrls?.length) {
    return [raw.imageUrl, ...raw.galleryUrls].filter(Boolean);
  }
  return raw.imageUrl ? [raw.imageUrl] : [];
}

export function normalizeProduct(product: Product): Product {
  const imageUrls = [...new Set(getProductImages(product))].slice(0, 6);
  return {
    ...product,
    imageUrls,
    imageUrl: product.imageUrl || imageUrls[0] || '',
    compareAtPrice: product.compareAtPrice ?? Math.round(product.price * 1.32),
    specifications: product.specifications ?? {
      SKU: product.id,
      Franchise: product.franchise,
    },
    additionalDetails: product.additionalDetails ?? product.description,
  };
}

export function formatInr(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

export function discountPercent(product: Product): number {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) {
    return 0;
  }
  return Math.round((1 - product.price / product.compareAtPrice) * 100);
}
