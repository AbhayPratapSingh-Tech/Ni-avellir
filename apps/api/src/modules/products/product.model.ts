import { Schema, model, type Model } from 'mongoose';
import type { ProductCategory, CurrencyCode } from '@nidavellir/shared/types';

export interface ProductVariantDocument {
  id: string;
  size?: string;
  color?: string;
  sku?: string;
  stock: number;
}

export interface ProductDocument {
  name: string;
  slug: string;
  category: ProductCategory;
  franchise: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: CurrencyCode;
  rating: number;
  reviewCount: number;
  stock: number;
  variants: ProductVariantDocument[];
  tags: string[];
  /** Merch bundle code e.g. DEMON_PR */
  bundleTag?: string;
  isBundleMain?: boolean;
  imageUrl: string;
  galleryUrls: string[];
  isLimitedDrop: boolean;
  isFeatured: boolean;
  sku?: string;
  runeXp: number;
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<ProductVariantDocument>(
  {
    id: { type: String, required: true, trim: true },
    size: { type: String, trim: true },
    color: { type: String, trim: true },
    sku: { type: String, trim: true, lowercase: true },
    stock: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: {
      type: String,
      enum: ['collectibles', 'apparel', 'desk-gear', 'limited-drops'],
      required: true,
      index: true,
    },
    franchise: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    stock: { type: Number, default: 0, min: 0 },
    variants: { type: [productVariantSchema], default: [] },
    sku: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    runeXp: { type: Number, default: 10, min: 0 },
    tags: { type: [String], default: [], index: true },
    bundleTag: { type: String, trim: true, index: true },
    isBundleMain: { type: Boolean, default: false, index: true },
    imageUrl: { type: String, required: true },
    galleryUrls: { type: [String], default: [] },
    isLimitedDrop: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

// Best sellers filter stock > 0 and sort reviewCount. No prior index covered that, so it scanned.
productSchema.index({ stock: 1, reviewCount: -1 });
productSchema.index({ 'variants.id': 1 });

export const Product: Model<ProductDocument> = model<ProductDocument>(
  'Product',
  productSchema,
);
