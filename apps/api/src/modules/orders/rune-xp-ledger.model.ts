import { Schema, model, type Model, type Types } from 'mongoose';

export type RuneXpEntryType = 'ORDER_EARN' | 'ORDER_REVERSE' | 'REDEEM' | 'ADMIN_ADJUST';

export interface RuneXpEntryDocument {
  userId: Types.ObjectId;
  type: RuneXpEntryType;
  /** Always positive. EARN and ADMIN_ADJUST add; REVERSE and REDEEM subtract. */
  amount: number;
  /** Set when a redeem is rolled back before the perk is granted. */
  voided?: boolean;
  orderId?: Types.ObjectId;
  /** Unique business key, e.g. order:{id}:ORDER_EARN */
  businessRef: string;
  createdAt: Date;
  updatedAt: Date;
}

const runeXpEntrySchema = new Schema<RuneXpEntryDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['ORDER_EARN', 'ORDER_REVERSE', 'REDEEM', 'ADMIN_ADJUST'],
      required: true,
    },
    amount: { type: Number, required: true, min: 1 },
    voided: { type: Boolean, default: false },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    businessRef: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

export const RuneXpEntry: Model<RuneXpEntryDocument> = model<RuneXpEntryDocument>(
  'RuneXpEntry',
  runeXpEntrySchema,
);

export function orderEarnRef(orderId: string) {
  return `order:${orderId}:ORDER_EARN`;
}

export function orderReverseRef(orderId: string) {
  return `order:${orderId}:ORDER_REVERSE`;
}
