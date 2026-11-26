export type { Money } from './money.js';
export type { CartQuote } from './cart.js';
export type { DemoOrder, ShippingAddress } from './order.js';
export type { ProductDetail, ProductSummary } from './product.js';

export type CurrencyCode = 'INR' | 'USD';

export type ProductCategory = 'collectibles' | 'apparel' | 'desk-gear' | 'limited-drops';

export type ProductVariant = {
  id: string;
  size?: string;
  color?: string;
  sku?: string;
  stock: number;
};

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  /** Game / IP line (e.g. God of War Ragnarok). */
  franchise: string;
  /** Licensed or house brand (e.g. PlayStation, Activision). */
  brand: string;
  description: string;
  price: number;
  compareAtPrice: number;
  currency: CurrencyCode;
  rating: number;
  reviewCount: number;
  /** Aggregate units available (sum of variants when present). */
  stock: number;
  /** Size / color SKUs with per-variant stock. Empty or omitted = product-level stock only. */
  variants?: ProductVariant[];
  tags: string[];
  imageUrl: string;
  imageUrls: string[];
  isLimitedDrop: boolean;
  /** Unique store SKU, e.g. nw87509 */
  sku: string;
  /** Rune XP awarded per unit purchased */
  runeXp: number;
  /** Optional merch bundle code (e.g. DEMON_PR) — also present in tags. */
  bundleTag?: string;
  /** True on the primary PDP target for a bundle set. */
  isBundleMain?: boolean;
  specifications: Record<string, string>;
  additionalDetails: string;
};

export type CartLine = {
  productId: string;
  /** Required when the product has variants. */
  variantId?: string;
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
