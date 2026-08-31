import { Schema, model, type Model } from 'mongoose';

export interface ServiceabilityDocument {
  pincodePrefix: string;
  codAvailable: boolean;
  shippingCharge: number;
  freeShippingThreshold: number;
  etaDays: number;
  active: boolean;
}

const serviceabilitySchema = new Schema<ServiceabilityDocument>(
  {
    pincodePrefix: { type: String, required: true, unique: true },
    codAvailable: { type: Boolean, default: true },
    shippingCharge: { type: Number, default: 99 },
    freeShippingThreshold: { type: Number, default: 1499 },
    etaDays: { type: Number, default: 5 },
    active: { type: Boolean, default: true },
  },
  { timestamps: false },
);

export const ServiceabilityRule: Model<ServiceabilityDocument> = model<ServiceabilityDocument>(
  'ServiceabilityRule',
  serviceabilitySchema,
);
