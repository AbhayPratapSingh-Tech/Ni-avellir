import { PaymentProviderCode } from '@nidavellir/shared/contracts';
import type {
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  PaymentProvider,
  VerifyPaymentInput,
} from '../payment-provider.js';

export class RazorpayProvider implements PaymentProvider {
  readonly code = PaymentProviderCode.Razorpay;

  async createIntent(_input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
    throw new Error('Razorpay payment intent creation is not implemented yet.');
  }

  async verifyPayment(_input: VerifyPaymentInput): Promise<boolean> {
    throw new Error('Razorpay signature verification is not implemented yet.');
  }
}
