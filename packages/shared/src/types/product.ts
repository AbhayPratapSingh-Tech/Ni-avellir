import type { ProductType } from '../constants/product-types.js';
import type { Money } from './money.js';

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  price: Money;
  thumbnailUrl: string;
  inStock: boolean;
};
