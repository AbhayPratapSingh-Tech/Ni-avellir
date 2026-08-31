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
  },
  { timestamps: true },
);

export const User: Model<UserDocument> = model<UserDocument>('User', userSchema);
