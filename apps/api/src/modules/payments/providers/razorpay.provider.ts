import crypto from 'node:crypto';
import { nanoid } from 'nanoid';
import Razorpay from 'razorpay';
import { PaymentProviderCode } from '@nidavellir/shared/contracts';
import type {
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  PaymentProvider,
  VerifyPaymentInput,
} from '../payment-provider.js';

function isUsableKey(value: string | undefined): value is string {
  if (!value) return false;
  if (value.startsWith('replace-with-')) return false;
  return value.length > 8;
}

export class RazorpayProvider implements PaymentProvider {
  readonly code = PaymentProviderCode.Razorpay;
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly demoMode: boolean;
  private readonly client: Razorpay | null;

  constructor(keyId?: string, keySecret?: string) {
    this.demoMode = !isUsableKey(keyId) || !isUsableKey(keySecret);
    this.keyId = this.demoMode ? 'rzp_test_demo_nidavellir' : keyId!;
    this.keySecret = this.demoMode ? 'demo_razorpay_secret_nidavellir' : keySecret!;
    this.client = this.demoMode
      ? null
      : new Razorpay({
          key_id: this.keyId,
          key_secret: this.keySecret,
        });
  }

  async createIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
    if (this.demoMode || !this.client) {
      return {
        provider: this.code,
        providerIntentId: `order_demo_${nanoid(12)}`,
        keyId: this.keyId,
        amountMinor: input.amount.amountMinor,
        currency: input.amount.currency,
        demoMode: true,
      };
    }

    const order = await this.client.orders.create({
      amount: input.amount.amountMinor,
      currency: input.amount.currency,
      receipt: input.checkoutId.slice(0, 40),
      notes: {
        checkoutId: input.checkoutId,
        customerId: input.customerId,
      },
    });

    return {
      provider: this.code,
      providerIntentId: String(order.id),
      keyId: this.keyId,
      amountMinor: input.amount.amountMinor,
      currency: input.amount.currency,
      demoMode: false,
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<boolean> {
    if (!input.signature) {
      return false;
    }

    const payload = `${input.providerIntentId}|${input.providerPaymentId}`;
    const expected = crypto.createHmac('sha256', this.keySecret).update(payload).digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(input.signature));
    } catch {
      return false;
    }
  }

  /** Dev/test helper: sign a successful payment the same way Checkout would. */
  signDemoPayment(orderId: string, paymentId: string): string {
    return crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
  }

  get isDemoMode() {
    return this.demoMode;
  }

  get publicKeyId() {
    return this.keyId;
  }
}
