export type CartItemDto = {
  productId: string;
  quantity: number;
};

export type AppliedCouponDto = {
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
};

export type CartQuoteDto = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  totalBeforeDiscount: number;
  itemCount: number;
  couponCode?: string;
  coupon?: AppliedCouponDto;
};

export type CartSessionResponse = {
  cart: { items: CartItemDto[]; couponCode?: string };
  quote: CartQuoteDto & {
    lines: Array<{ product: unknown; quantity: number; lineTotal: number }>;
  };
};

export type ServiceabilityDto = {
  pincode: string;
  serviceable: boolean;
  codAvailable: boolean;
  shippingCharge: number;
  freeShippingThreshold: number;
  etaDays: number;
};
