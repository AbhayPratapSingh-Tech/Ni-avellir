import { Schema, model, type Model, type Types } from 'mongoose';

export interface OrderDocument {
  userId?: Types.ObjectId;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    lineTotal: number;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  paymentMethod: string;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  estimatedDelivery: string;
  cancelReason?: string;
  returnRequest?: {
    reason: string;
    status: 'requested' | 'approved' | 'rejected' | 'completed';
    requestedAt: Date;
  };
  exchangeRequest?: {
    reason: string;
    status: 'requested' | 'approved' | 'rejected' | 'completed';
    requestedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<OrderDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    orderNumber: { type: String, required: true, unique: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    items: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        imageUrl: { type: String, default: '' },
        lineTotal: { type: Number, required: true },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    paymentMethod: { type: String, required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, default: 'confirmed' },
    estimatedDelivery: { type: String, required: true },
    cancelReason: { type: String },
    returnRequest: {
      reason: { type: String },
      status: { type: String, enum: ['requested', 'approved', 'rejected', 'completed'] },
      requestedAt: { type: Date },
    },
    exchangeRequest: {
      reason: { type: String },
      status: { type: String, enum: ['requested', 'approved', 'rejected', 'completed'] },
      requestedAt: { type: Date },
    },
  },
  { timestamps: true },
);

orderSchema.index({ 'customer.email': 1 });

export const Order: Model<OrderDocument> = model<OrderDocument>('Order', orderSchema);
