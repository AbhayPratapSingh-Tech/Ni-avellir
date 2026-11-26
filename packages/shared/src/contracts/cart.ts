import type { CartQuote } from '../types/cart.js';

export type CartQuoteItemInput = {
  productId: string;
  variantId?: string;
  quantity: number;
};

export type CartQuoteRequest = {
  items: CartQuoteItemInput[];
};

export type CartQuoteResponse = {
  quote: CartQuote;
};
