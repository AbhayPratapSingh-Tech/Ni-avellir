export const PaymentProviderCode = {
  Razorpay: 'razorpay',
  CashOnDelivery: 'cash_on_delivery',
  Stripe: 'stripe',
  PayPal: 'paypal',
} as const;

export type PaymentProviderCode = (typeof PaymentProviderCode)[keyof typeof PaymentProviderCode];

export const OnlineOrderStatus = {
  PendingPayment: 'pending_payment',
  Paid: 'paid',
  Processing: 'processing',
  Packed: 'packed',
  Shipped: 'shipped',
  Delivered: 'delivered',
  Cancelled: 'cancelled',
  Refunded: 'refunded',
} as const;

export type OnlineOrderStatus = (typeof OnlineOrderStatus)[keyof typeof OnlineOrderStatus];

export const CashOnDeliveryOrderStatus = {
  PendingConfirmation: 'pending_confirmation',
  Confirmed: 'confirmed',
  Processing: 'processing',
  Packed: 'packed',
  Shipped: 'shipped',
  DeliveredPaymentReceived: 'delivered_payment_received',
  Cancelled: 'cancelled',
} as const;

export type CashOnDeliveryOrderStatus =
  (typeof CashOnDeliveryOrderStatus)[keyof typeof CashOnDeliveryOrderStatus];
