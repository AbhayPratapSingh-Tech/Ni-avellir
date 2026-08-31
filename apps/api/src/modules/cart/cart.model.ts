import { Schema, model, type Model, type Types } from 'mongoose';

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartDocument {
  userId?: Types.ObjectId;
  guestSessionId?: string;
  items: CartItem[];
  couponCode?: string;
  updatedAt: Date;
  createdAt: Date;
}

const cartSchema = new Schema<CartDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, sparse: true },
    guestSessionId: { type: String, index: true, sparse: true },
    items: [
      {
        productId: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    couponCode: { type: String },
  },
  { timestamps: true },
);

cartSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { userId: { $exists: true } } });
cartSchema.index(
  { guestSessionId: 1 },
  { unique: true, partialFilterExpression: { guestSessionId: { $exists: true } } },
);

export const Cart: Model<CartDocument> = model<CartDocument>('Cart', cartSchema);
