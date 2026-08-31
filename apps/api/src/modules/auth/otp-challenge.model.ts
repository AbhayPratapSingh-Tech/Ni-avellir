import { Schema, model, type Model } from 'mongoose';

export type OtpPurpose = 'login' | 'verify_phone' | 'reset_password' | 'verify_email';

export interface OtpChallengeDocument {
  phone?: string;
  email?: string;
  codeHash: string;
  purpose: OtpPurpose;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

const otpChallengeSchema = new Schema<OtpChallengeDocument>(
  {
    phone: { type: String, index: true },
    email: { type: String, lowercase: true, index: true },
    codeHash: { type: String, required: true },
    purpose: {
      type: String,
      enum: ['login', 'verify_phone', 'reset_password', 'verify_email'],
      required: true,
    },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpChallenge: Model<OtpChallengeDocument> = model<OtpChallengeDocument>(
  'OtpChallenge',
  otpChallengeSchema,
);
