import { Schema, model, type Model } from 'mongoose';

export interface PaymentDocument {
  orderId: string;
  orderNumber: string;
  provider: string;
  providerIntentId: string;
  providerPaymentId?: string;
  amountMinor: number;
  currency: string;
  status: 'created' | 'paid' | 'failed';
  demoMode: boolean;
  raw?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    orderId: { type: String, required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    provider: { type: String, required: true },
    providerIntentId: { type: String, required: true, unique: true },
    providerPaymentId: { type: String },
    amountMinor: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
    demoMode: { type: Boolean, default: false },
    raw: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

paymentSchema.index({ providerPaymentId: 1 }, { sparse: true });

export const Payment: Model<PaymentDocument> = model<PaymentDocument>('Payment', paymentSchema);
