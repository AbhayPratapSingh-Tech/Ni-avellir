import { Schema, model, type Model } from 'mongoose';

export interface PaymentWebhookEventDocument {
  eventId: string;
  event: string;
  provider: string;
  providerPaymentId?: string;
  providerIntentId?: string;
  status: 'processed' | 'ignored' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const paymentWebhookEventSchema = new Schema<PaymentWebhookEventDocument>(
  {
    eventId: { type: String, required: true, unique: true },
    event: { type: String, required: true },
    provider: { type: String, required: true, default: 'razorpay' },
    providerPaymentId: { type: String },
    providerIntentId: { type: String },
    status: { type: String, enum: ['processed', 'ignored', 'failed'], required: true },
  },
  { timestamps: true },
);

export const PaymentWebhookEvent: Model<PaymentWebhookEventDocument> = model<PaymentWebhookEventDocument>(
  'PaymentWebhookEvent',
  paymentWebhookEventSchema,
);
