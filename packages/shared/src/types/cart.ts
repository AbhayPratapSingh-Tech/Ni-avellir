import type { Money } from './money.js';
import type { ProductSummary } from './product.js';

export type CartLine = {
  product: ProductSummary;
  quantity: number;
  lineTotal: Money;
};

export type CartQuote = {
  lines: CartLine[];
  subtotal: Money;
  shipping: Money;
  tax: Money;
  total: Money;
  itemCount: number;
};
