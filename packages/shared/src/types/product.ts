import type { ProductType } from '../constants/product-types.js';
import type { Money } from './money.js';

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  franchise: string;
  platform: string;
  shortDescription: string;
  price: Money;
  compareAtPrice?: Money;
  thumbnailUrl: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  inStock: boolean;
  stockCount: number;
  isFeatured: boolean;
};

export type ProductDetail = ProductSummary & {
  description: string;
  galleryUrls: string[];
  specifications: Record<string, string>;
};
