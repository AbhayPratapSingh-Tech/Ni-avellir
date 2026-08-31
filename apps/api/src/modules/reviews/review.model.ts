import { Schema, model, type Model, type Types } from 'mongoose';

export interface ReviewDocument {
  userId: Types.ObjectId;
  productId: string;
  name: string;
  rating: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<ReviewDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    body: { type: String, required: true },
  },
  { timestamps: true },
);

export const Review: Model<ReviewDocument> = model<ReviewDocument>('Review', reviewSchema);
