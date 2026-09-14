import type { AIProductCard } from '@nidavellir/shared';

type LeanProduct = {
  _id?: unknown;
  id?: unknown;
  name?: string;
  slug?: string;
  category?: string;
  franchise?: string;
  brand?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  tags?: string[];
  imageUrl?: string;
  galleryUrls?: string[];
  isLimitedDrop?: boolean;
  sku?: string;
  runeXp?: number;
  bundleTag?: string;
  isBundleMain?: boolean;
  specifications?: Record<string, string>;
  additionalDetails?: string;
};

export function toAiProduct(raw: LeanProduct): AIProductCard {
  const id = String(raw._id ?? raw.id ?? '');
  const franchise = String(raw.franchise ?? '');
  const stock = Number(raw.stock ?? 0);
  const imageUrl = String(raw.imageUrl ?? '');
  return {
    id,
    name: String(raw.name ?? ''),
    slug: raw.slug ? String(raw.slug) : undefined,
    category: (raw.category as AIProductCard['category']) ?? 'collectibles',
    franchise,
    brand: String(raw.brand ?? franchise),
    description: String(raw.description ?? ''),
    price: Number(raw.price ?? 0),
    compareAtPrice: Number(raw.compareAtPrice ?? raw.price ?? 0),
    currency: (raw.currency as AIProductCard['currency']) ?? 'INR',
    rating: Number(raw.rating ?? 0),
    reviewCount: Number(raw.reviewCount ?? 0),
    stock,
    inStock: stock > 0,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    imageUrl,
    imageUrls: Array.isArray(raw.galleryUrls) && raw.galleryUrls.length
      ? raw.galleryUrls.map(String)
      : imageUrl
        ? [imageUrl]
        : [],
    isLimitedDrop: Boolean(raw.isLimitedDrop),
    sku: String(raw.sku ?? ''),
    runeXp: Number(raw.runeXp ?? 10),
    bundleTag: raw.bundleTag ? String(raw.bundleTag) : undefined,
    isBundleMain: raw.isBundleMain ? Boolean(raw.isBundleMain) : undefined,
    specifications: raw.specifications ?? {},
    additionalDetails: raw.additionalDetails ?? '',
  };
}
