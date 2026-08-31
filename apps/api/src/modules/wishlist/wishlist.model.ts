import { Schema, model, type Model, type Types } from 'mongoose';

export interface WishlistDocument {
  userId: Types.ObjectId;
  productIds: string[];
  updatedAt: Date;
  createdAt: Date;
}

const wishlistSchema = new Schema<WishlistDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    productIds: [{ type: String }],
  },
  { timestamps: true },
);

export const Wishlist: Model<WishlistDocument> = model<WishlistDocument>(
  'Wishlist',
  wishlistSchema,
);
