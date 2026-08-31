import { Schema, model, type Model } from 'mongoose';
import type { ProductCategory, CurrencyCode } from '@nidavellir/shared/types';

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
  tags: string[];
  imageUrl: string;
  galleryUrls: string[];
  isLimitedDrop: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
    tags: { type: [String], default: [] },
    imageUrl: { type: String, required: true },
    galleryUrls: { type: [String], default: [] },
    isLimitedDrop: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

export const Product: Model<ProductDocument> = model<ProductDocument>(
  'Product',
  productSchema,
);
