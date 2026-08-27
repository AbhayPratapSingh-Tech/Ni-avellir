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
    theme: { color: colors.accent },
    notes: {
      orderNumber: input.orderNumber,
    },
  };

  try {
    return await RazorpayCheckout.open(options);
  } catch (error) {
    const err = error as RazorpayErrorResponse;
    const description =
      err?.error?.description || err?.description || (error as Error)?.message || 'Payment cancelled';
    const code = err?.error?.code || err?.code;
    const message = code ? `${description} (${code})` : description;
    throw new Error(message);
  }
}
