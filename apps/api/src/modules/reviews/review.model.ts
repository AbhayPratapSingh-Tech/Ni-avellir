import { Schema, model, type Model, type Types } from 'mongoose';

export interface ReviewDocument {
  userId: Types.ObjectId;
  productId: string;
  name: string;
  rating: number;
  title?: string;
  body: string;
  avatarUrl?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<ReviewDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, maxlength: 70 },
    body: { type: String, required: true, maxlength: 1500 },
    avatarUrl: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true },
);

export const Review: Model<ReviewDocument> = model<ReviewDocument>('Review', reviewSchema);
