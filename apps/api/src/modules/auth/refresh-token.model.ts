import { Schema, model, type Model, type Types } from 'mongoose';

export interface RefreshTokenDocument {
  userId: Types.ObjectId;
  tokenHash: string;
  deviceId?: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    deviceId: { type: String },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken: Model<RefreshTokenDocument> = model<RefreshTokenDocument>(
  'RefreshToken',
  refreshTokenSchema,
);
