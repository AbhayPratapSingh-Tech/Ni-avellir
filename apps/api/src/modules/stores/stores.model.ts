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

/**
 * Optional seed examples (commented — leave collection empty until you add real stores):
 *
 * await Store.insertMany([
 *   {
 *     name: 'Niðavellir Flagship — Bengaluru',
 *     address: '12 MG Road',
 *     city: 'Bengaluru',
 *     state: 'Karnataka',
 *     pincode: '560001',
 *     lat: 12.9716,
 *     lng: 77.5946,
 *     phone: '+91 80 0000 0000',
 *     active: true,
 *   },
 *   {
 *     name: 'Niðavellir — Mumbai',
 *     address: '45 Linking Road, Bandra',
 *     city: 'Mumbai',
 *     state: 'Maharashtra',
 *     pincode: '400050',
 *     lat: 19.0596,
 *     lng: 72.8295,
 *     active: true,
 *   },
 * ]);
 */
