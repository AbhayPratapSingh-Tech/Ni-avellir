import type { CartQuote } from '../types/cart.js';

export type CartQuoteItemInput = {
  productId: string;
  quantity: number;
};

export type CartQuoteRequest = {
  items: CartQuoteItemInput[];
};

export type CartQuoteResponse = {
  quote: CartQuote;
};
