import type { PaymentProviderCode } from '@nidavellir/shared/contracts';
import type {
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  PaymentProvider,
  VerifyPaymentInput,
} from './payment-provider.js';

export class PaymentService {
  private readonly providers: Map<PaymentProviderCode, PaymentProvider>;

  constructor(providers: PaymentProvider[]) {
    this.providers = new Map(providers.map((provider) => [provider.code, provider]));
  }

  createIntent(
    providerCode: PaymentProviderCode,
    input: CreatePaymentIntentInput,
  ): Promise<CreatePaymentIntentResult> {
    return this.getProvider(providerCode).createIntent(input);
  }

  verifyPayment(providerCode: PaymentProviderCode, input: VerifyPaymentInput): Promise<boolean> {
    return this.getProvider(providerCode).verifyPayment(input);
  }

  private getProvider(providerCode: PaymentProviderCode): PaymentProvider {
    const provider = this.providers.get(providerCode);

    if (!provider) {
      throw new Error(`Payment provider is not registered: ${providerCode}`);
    }

    return provider;
  }
}
