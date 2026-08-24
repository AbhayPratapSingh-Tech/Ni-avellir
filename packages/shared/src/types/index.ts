export type { Money } from './money.js';
export type { CartQuote } from './cart.js';
export type { DemoOrder, ShippingAddress } from './order.js';
export type { ProductDetail, ProductSummary } from './product.js';

export type CurrencyCode = 'INR' | 'USD';

export type ProductCategory = 'collectibles' | 'apparel' | 'desk-gear' | 'limited-drops';

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  franchise: string;
  description: string;
  price: number;
  compareAtPrice: number;
  currency: CurrencyCode;
  rating: number;
  reviewCount: number;
  stock: number;
  tags: string[];
  imageUrl: string;
  imageUrls: string[];
  isLimitedDrop: boolean;
  specifications: Record<string, string>;
  additionalDetails: string;
};

export type CartLine = {
  productId: string;
  quantity: number;
};

export type OrderStatus = 'placed' | 'packed' | 'shipped' | 'delivered';

export type OrderPreview = {
  id: string;
  status: OrderStatus;
  total: number;
  currency: CurrencyCode;
  estimatedDelivery: string;
  itemCount: number;
};

export type MarketplaceOverview = {
  products: Product[];
  featuredProductId: string;
  cart: CartLine[];
  latestOrder: OrderPreview;
};
