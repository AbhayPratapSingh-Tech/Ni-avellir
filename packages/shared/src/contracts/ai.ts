import type { Product } from '../types/index.js';

export type AIChatRequest = {
  conversationId?: string;
  message: string;
};

export type AIProductCard = Pick<
  Product,
  | 'id'
  | 'name'
  | 'category'
  | 'franchise'
  | 'brand'
  | 'description'
  | 'price'
  | 'compareAtPrice'
  | 'currency'
  | 'rating'
  | 'reviewCount'
  | 'stock'
  | 'tags'
  | 'imageUrl'
  | 'imageUrls'
  | 'isLimitedDrop'
  | 'sku'
  | 'runeXp'
> & {
  slug?: string;
  inStock: boolean;
  specifications?: Record<string, string>;
  additionalDetails?: string;
  bundleTag?: string;
  isBundleMain?: boolean;
};

export type AICartLine = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl?: string;
};

export type AICartPayload = {
  items: AICartLine[];
  itemCount: number;
  subtotal: number;
  total: number;
  currency: string;
};

export type AIWishlistPayload = {
  productIds: string[];
  products: AIProductCard[];
};

export type AIOrderPayload = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  estimatedDelivery?: string;
  itemCount: number;
  items?: Array<{ name: string; quantity: number; lineTotal: number }>;
};

type AIResponseBase = {
  conversationId: string;
  message: string;
};

export type AITextResponse = AIResponseBase & {
  type: 'text';
};

export type AIProductResultsResponse = AIResponseBase & {
  type: 'product_results';
  products: AIProductCard[];
};

export type AICartResponse = AIResponseBase & {
  type: 'cart';
  cart: AICartPayload;
};

export type AIWishlistResponse = AIResponseBase & {
  type: 'wishlist';
  wishlist: AIWishlistPayload;
};

export type AIOrderResponse = AIResponseBase & {
  type: 'order';
  order: AIOrderPayload;
};

export type AIErrorResponse = AIResponseBase & {
  type: 'error';
  code?: string;
};

export type AIResponse =
  | AITextResponse
  | AIProductResultsResponse
  | AICartResponse
  | AIWishlistResponse
  | AIOrderResponse
  | AIErrorResponse;
