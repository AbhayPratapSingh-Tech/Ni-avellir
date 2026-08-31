import { Schema, model, type Model } from 'mongoose';

export interface CouponDocument {
  code: string;
  description?: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  productIds: string[];
  categories: string[];
  userIds: string[];
  firstOrderOnly: boolean;
  usageLimit: number;
  usedCount: number;
  expiresAt?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<CouponDocument>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    discountType: { type: String, enum: ['percent', 'flat'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    productIds: [{ type: String }],
    categories: [{ type: String }],
    userIds: [{ type: String }],
    firstOrderOnly: { type: Boolean, default: false },
    usageLimit: { type: Number, default: 1000 },
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Coupon: Model<CouponDocument> = model<CouponDocument>('Coupon', couponSchema);
