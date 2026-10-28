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
  private readonly webhookSecret?: string;
  private readonly demoMode: boolean;
  private readonly client: Razorpay | null;

  constructor(keyId?: string, keySecret?: string, webhookSecret?: string) {
    this.demoMode = !isUsableKey(keyId) || !isUsableKey(keySecret);
    this.keyId = this.demoMode ? 'rzp_test_demo_nidavellir' : keyId!;
    this.keySecret = this.demoMode ? 'demo_razorpay_secret_nidavellir' : keySecret!;
    this.webhookSecret = isUsableKey(webhookSecret) ? webhookSecret : undefined;
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

  /** Verify Razorpay webhook POST body using the Dashboard webhook secret. */
  verifyWebhookSignature(rawBody: Buffer | string, signature?: string): boolean {
    if (!signature || !this.webhookSecret) {
      return false;
    }
    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expected = crypto.createHmac('sha256', this.webhookSecret).update(body).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
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

  /**
   * Look up a captured/authorized payment for a Razorpay order id (providerIntentId).
   * Used by reconciliation when client /confirm never arrived.
   */
  async findCapturedPayment(
    providerIntentId: string,
  ): Promise<{ id: string; status: string } | null> {
    if (this.demoMode || !this.client) {
      return null;
    }
    try {
      const result = await this.client.orders.fetchPayments(providerIntentId);
      const items = (result as { items?: Array<{ id?: string; status?: string }> }).items ?? [];
      const hit = items.find((p) => p.status === 'captured' || p.status === 'authorized');
      if (!hit?.id) return null;
      return { id: String(hit.id), status: String(hit.status) };
    } catch {
      return null;
    }
  }

  get isDemoMode() {
    return this.demoMode;
  }

  get hasWebhookSecret() {
    return Boolean(this.webhookSecret);
  }

  get publicKeyId() {
    return this.keyId;
  }
}
