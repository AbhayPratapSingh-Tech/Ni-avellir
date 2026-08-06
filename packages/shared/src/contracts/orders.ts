import type { DemoOrder, ShippingAddress } from '../types/order.js';
import type { CartQuoteItemInput } from './cart.js';

export type CreateOrderRequest = {
  items: CartQuoteItemInput[];
  shippingAddress: ShippingAddress;
  paymentMethod: 'cash_on_delivery' | 'razorpay_demo';
};

export type CreateOrderResponse = {
  order: DemoOrder;
};
