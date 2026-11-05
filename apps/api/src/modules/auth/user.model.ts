import { Schema, model, type Model } from 'mongoose';

export interface UserDocument {
  name: string;
  email: string;
  phone: string;
  passwordHash?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: 'customer' | 'admin';
  avatarUrl?: string;
  runeXp: number;
  /** One credit waives shipping on the next order that would otherwise charge it. */
  freeShippingCredits: number;
  /** While this is in the future, Drop Zone includes the rest of the eligible pool. */
  dropZoneEarlyUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    avatarUrl: { type: String },
    runeXp: { type: Number, default: 0, min: 0 },
    freeShippingCredits: { type: Number, default: 0, min: 0 },
    dropZoneEarlyUntil: { type: Date },
  },
  { timestamps: true },
);

export const User: Model<UserDocument> = model<UserDocument>('User', userSchema);
