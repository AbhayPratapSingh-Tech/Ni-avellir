import { Schema, model, type Model, type Types } from 'mongoose';

export interface NotificationDocument {
  userId: Types.ObjectId;
  type: string;
  title: string;
  body: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Notification: Model<NotificationDocument> = model<NotificationDocument>(
  'Notification',
  notificationSchema,
);
