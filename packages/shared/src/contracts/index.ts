import type { MarketplaceOverview, Product } from '../types/index.js';

export type ApiEnvelope<T> = {
  data: T;
  meta: {
    requestId: string;
    generatedAt: string;
  };
};

export type ProductsResponse = ApiEnvelope<{
  products: Product[];
}>;

export type MarketplaceOverviewResponse = ApiEnvelope<MarketplaceOverview>;

export * from './payments.js';
export * from './cart.js';
export * from './catalog.js';
export * from './orders.js';
export * from './auth.js';
export * from './addresses.js';
export * from './cart-session.js';
