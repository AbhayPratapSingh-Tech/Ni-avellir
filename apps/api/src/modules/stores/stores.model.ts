import { Schema, model, type Model, Types } from 'mongoose';

export interface StoreDocument {
  _id: Types.ObjectId;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  phone?: string;
  active: boolean;
}

const storeSchema = new Schema<StoreDocument>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    state: { type: String, required: true, trim: true, index: true },
    pincode: { type: String, required: true, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    phone: { type: String, trim: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const Store: Model<StoreDocument> = model<StoreDocument>('Store', storeSchema);
