import RazorpayCheckout, {
  type RazorpayCheckoutOptions,
  type RazorpayErrorResponse,
  type RazorpaySuccessResponse,
} from 'react-native-razorpay';
import { colors } from '../../theme/tokens';

export type OpenRazorpayInput = {
  keyId: string;
  providerIntentId: string;
  amountMinor: number;
  currency: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

export async function openRazorpayCheckout(
  input: OpenRazorpayInput,
): Promise<RazorpaySuccessResponse> {
  const options: RazorpayCheckoutOptions = {
    key: input.keyId,
    amount: input.amountMinor,
    currency: input.currency || 'INR',
    name: 'Nidavellir',
    description: `Order ${input.orderNumber}`,
    order_id: input.providerIntentId,
    prefill: {
      name: input.customerName,
      email: input.customerEmail,
      contact: input.customerPhone,
    },
    theme: { color: colors.text },
    notes: {
      orderNumber: input.orderNumber,
    },
  };

  try {
    return await RazorpayCheckout.open(options);
  } catch (error) {
    const err = error as RazorpayErrorResponse;
    const rawDescription = err?.error?.description || err?.description || (error as Error)?.message;
    const description =
      rawDescription && String(rawDescription) !== 'undefined' ? String(rawDescription) : '';
    const code = String(err?.error?.code || err?.code || '');
    const reason = String(err?.error?.reason || '').toLowerCase();
    const descLower = description.toLowerCase();

    // User dismissed Razorpay — SDK often returns BAD_REQUEST_ERROR with an empty/undefined description.
    const isCancel =
      reason === 'payment_cancelled' ||
      reason === 'payment_canceled' ||
      descLower.includes('cancel') ||
      ((!description || description === 'undefined') &&
        (code === 'BAD_REQUEST_ERROR' || code === '2' || !code));

    if (isCancel) {
      throw new Error('You have cancelled the Payment');
    }

    const message = code ? `${description || 'Payment failed'} (${code})` : description || 'Payment failed';
    throw new Error(message);
  }
}
