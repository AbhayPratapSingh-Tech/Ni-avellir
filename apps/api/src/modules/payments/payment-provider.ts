import type { PaymentProviderCode } from '@nidavellir/shared/contracts';
import type { Money } from '@nidavellir/shared/types';

export type CreatePaymentIntentInput = {
  checkoutId: string;
  amount: Money;
  customerId: string;
};

export type CreatePaymentIntentResult = {
  provider: PaymentProviderCode;
  providerIntentId: string;
  clientSecret?: string;
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
