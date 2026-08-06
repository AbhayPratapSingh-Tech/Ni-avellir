import type { CartQuote } from './cart.js';

export const OrderStatus = {
  Draft: 'draft',
  Confirmed: 'confirmed',
  Packed: 'packed',
  Shipped: 'shipped',
  Delivered: 'delivered',
  Cancelled: 'cancelled',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export type ShippingAddress = {
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
};

export type DemoOrder = {
  id: string;
  status: OrderStatus;
  quote: CartQuote;
  shippingAddress: ShippingAddress;
  createdAt: string;
};
