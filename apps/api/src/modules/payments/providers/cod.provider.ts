import { PaymentProviderCode } from '@nidavellir/shared/contracts';
import type {
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  PaymentProvider,
  VerifyPaymentInput,
} from '../payment-provider.js';

export class CashOnDeliveryProvider implements PaymentProvider {
  readonly code = PaymentProviderCode.CashOnDelivery;

  async createIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
    return {
      provider: this.code,
      providerIntentId: `cod_${input.checkoutId}`,
    };
  }

  async verifyPayment(_input: VerifyPaymentInput): Promise<boolean> {
    return true;
  }
}
