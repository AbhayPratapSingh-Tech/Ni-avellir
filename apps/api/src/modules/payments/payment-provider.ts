import type { PaymentProviderCode } from '@nidavellir/shared/contracts';
import type { Money } from '@nidavellir/shared/types';

export type CreatePaymentIntentInput = {
  checkoutId: string;
  amount: Money;
  customerId: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

export type CreatePaymentIntentResult = {
  provider: PaymentProviderCode;
  /** Razorpay order id (or demo order id). */
  providerIntentId: string;
  /** Public key id for Checkout (test or live). */
  keyId: string;
  amountMinor: number;
  currency: string;
  demoMode: boolean;
};

export type VerifyPaymentInput = {
  providerIntentId: string;
  providerPaymentId: string;
  signature?: string;
};

export type PaymentProvider = {
  readonly code: PaymentProviderCode;
  createIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<boolean>;
};
