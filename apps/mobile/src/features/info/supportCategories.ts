/**
 * Raise-a-query categories adapted from Bhima support form for Nidavellir merch.
 * No jewellery category. No file uploads (Sheets Web App limitation).
 */

export type SupportExtraField =
  | 'order'
  | 'productSku'
  | 'orderDate'
  | 'affectedProduct'
  | 'paymentMode'
  | 'transactionId'
  | 'paymentAmount'
  | 'paymentDate'
  | 'awb'
  | 'expectedDate'
  | 'deliveryAddress'
  | 'returnProduct'
  | 'returnRequestId'
  | 'refundAmount'
  | 'refundReference'
  | 'registeredMobile'
  | 'registeredEmail'
  | 'pageUrl'
  | 'errorMessage'
  | 'device'
  | 'couponCode';

export type SupportCategoryConfig = {
  fields: SupportExtraField[];
  subs: string[];
  /** Bhima showed upload for these — we tip the user instead of attaching files. */
  tipUpload?: boolean;
};

export const SUPPORT_CATEGORY_CONFIG: Record<string, SupportCategoryConfig> = {
  'Product Related': {
    tipUpload: true,
    fields: ['order', 'productSku'],
    subs: [
      'Product information',
      'Product quality',
      'Product received different from ordered',
      'Product damaged',
      'Missing product',
      'Wrong product',
      'Product specification/query',
      'Product authenticity',
    ],
  },
  'Order Related': {
    fields: ['order', 'orderDate', 'productSku'],
    subs: [
      'Order status',
      'Order confirmation',
      'Order modification',
      'Order cancellation',
      'Order not showing',
      'Incorrect order details',
      'Order split/partial order',
    ],
  },
  'Payment Related': {
    fields: ['order', 'paymentMode', 'transactionId', 'paymentAmount', 'paymentDate'],
    subs: [
      'Payment failed',
      'Payment deducted but order not created',
      'Payment pending',
      'Payment gateway issue',
      'Incorrect payment amount',
      'COD/payment-related query',
    ],
  },
  'Delivery Related': {
    fields: ['order', 'awb', 'expectedDate', 'deliveryAddress'],
    subs: [
      'Delivery status',
      'Shipment tracking',
      'Delivery delayed',
      'Delivery not received',
      'Wrong delivery address',
      'Partial delivery',
      'Damaged package',
      'Delivery rescheduling',
    ],
  },
  'Return Related': {
    tipUpload: true,
    fields: ['order', 'returnProduct', 'returnRequestId'],
    subs: [
      'Return request',
      'Return eligibility',
      'Return pickup',
      'Pickup delayed',
      'Return rejected',
      'Return status',
      'Return issue',
      'Wrong/damaged product return',
    ],
  },
  'Refund Related': {
    fields: ['order', 'refundAmount', 'refundReference'],
    subs: [
      'Refund initiated',
      'Refund pending',
      'Refund not received',
      'Partial refund',
      'Refund amount discrepancy',
      'Refund to wrong payment method',
    ],
  },
  'Account / Login': {
    fields: ['registeredMobile', 'registeredEmail'],
    subs: ['Login issue', 'OTP issue', 'Account access', 'Profile update', 'Mobile/email change'],
  },
  'App Related': {
    tipUpload: true,
    // No PageUrl — mobile app (use Device + Error message instead).
    fields: ['errorMessage', 'device'],
    subs: [
      'App error',
      'Screen not loading',
      'Product page issue',
      'Cart issue',
      'Checkout issue',
      'Coupon/offer issue',
      'Technical error',
    ],
  },
  'Offers & Promotions': {
    tipUpload: true,
    fields: ['couponCode', 'order'],
    subs: [
      'Offer eligibility',
      'Coupon not working',
      'Discount discrepancy',
      'Campaign-related query',
      'Offer terms clarification',
    ],
  },
  'Other / General Query': {
    tipUpload: true,
    fields: [],
    subs: ['General enquiry', 'Feedback', 'Complaint'],
  },
};

export const SUPPORT_CATEGORIES = Object.keys(SUPPORT_CATEGORY_CONFIG);

export function getCategoryConfig(category: string): SupportCategoryConfig | undefined {
  return SUPPORT_CATEGORY_CONFIG[category];
}

export function categoryShowsField(category: string, field: SupportExtraField): boolean {
  return getCategoryConfig(category)?.fields.includes(field) ?? false;
}

export const EXTRA_FIELD_LABELS: Record<SupportExtraField, string> = {
  order: 'Order number',
  productSku: 'Product SKU',
  orderDate: 'Order date',
  affectedProduct: 'Product SKU',
  paymentMode: 'Payment mode',
  transactionId: 'Transaction ID',
  paymentAmount: 'Payment amount',
  paymentDate: 'Payment date',
  awb: 'AWB / tracking no.',
  expectedDate: 'Expected delivery date',
  deliveryAddress: 'Delivery address',
  returnProduct: 'Return product',
  returnRequestId: 'Return request ID',
  refundAmount: 'Refund amount',
  refundReference: 'Refund reference',
  registeredMobile: 'Registered mobile',
  registeredEmail: 'Registered email',
  pageUrl: 'Screen / page',
  errorMessage: 'Error message',
  device: 'Device',
  couponCode: 'Offer / coupon code',
};
