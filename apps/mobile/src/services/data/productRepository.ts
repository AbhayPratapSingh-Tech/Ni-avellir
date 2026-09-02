import { appConfig } from '../../config/appConfig';
import { ALSO_LIKE_TAG, demoMarketplaceOverview, demoProducts } from '@nidavellir/shared';
import type { Product } from '@nidavellir/shared';
import { apiClient } from '../api/apiClient';
import { normalizeProduct } from '../../lib/productMedia';

/**
 * ProductRepository abstracts the data source.
 *
 * - In `mock` mode it returns bundled demo data instantly (no network).
 * - In `api` mode it calls the live backend, then falls back to mock if the
 *   request fails (emulator, offline, API down).
 */
export interface ProductListResult {
  items: Product[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ProductListQuery {
  category?: string;
  franchise?: string;
  search?: string;
  collection?: 'bestsellers' | 'deals' | 'also-like' | 'restocking';
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

export interface CartQuote {
  items: Array<{ productId: string; quantity: number }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}

export interface CreateOrderInput {
  customer: { name: string; email: string; phone: string };
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  paymentMethod: string;
}

export interface SearchSuggestions {
  queries: string[];
  categories: string[];
  franchises: string[];
  brands: string[];
}

function listFromMock(query: ProductListQuery = {}): ProductListResult {
  let items = demoProducts.map(normalizeProduct);
  if (query.category) {
    items = items.filter((p) => p.category === query.category);
  }
  if (query.franchise) {
    const needle = query.franchise.toLowerCase();
    items = items.filter(
      (p) => p.franchise.toLowerCase() === needle || p.brand.toLowerCase() === needle,
    );
  }
  if (query.search) {
    const q = query.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.franchise.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }
  if (query.collection === 'bestsellers') {
    items.sort((a, b) => b.reviewCount - a.reviewCount);
  }
  if (query.collection === 'deals') {
    items.sort((a, b) => b.compareAtPrice - b.price - (a.compareAtPrice - a.price));
  }
  if (query.collection === 'also-like') {
    // Future API: products tagged for recommendations (e.g. "you-may-also-like").
    const tagged = items.filter((p) =>
      p.tags.some((tag) => tag.toLowerCase() === ALSO_LIKE_TAG),
    );
    items = tagged.length ? tagged : items.sort((a, b) => b.rating - a.rating);
  }
  if (query.collection === 'restocking') {
    items = items.filter((p) => p.stock === 0);
  }
  if (query.sort === 'price_asc') items.sort((a, b) => a.price - b.price);
  if (query.sort === 'price_desc') items.sort((a, b) => b.price - a.price);
  if (query.sort === 'rating') items.sort((a, b) => b.rating - a.rating);

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const total = items.length;
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 1,
  };
}

function mapApiProduct(raw: Record<string, unknown>): Product {
  const id = String(raw._id ?? raw.id ?? '');
  const franchise = String(raw.franchise ?? '');
  const mapped: Product = {
    ...(raw as Product),
    id,
    brand: String(raw.brand ?? franchise),
    franchise,
  };
  if (raw.compareAtPrice !== undefined) {
    mapped.compareAtPrice = Number(raw.compareAtPrice);
  }
  return normalizeProduct(mapped);
}

function mapProducts(items: unknown[] = []): Product[] {
  return items.map((item) => mapApiProduct(item as Record<string, unknown>));
}

function categoriesFromMock(): string[] {
  return [...new Set(demoProducts.map((p) => p.category))];
}

function suggestionsFromMock(): SearchSuggestions {
  const queries = [
    ...new Set([
      ...demoProducts.flatMap((p) => p.tags),
      ...demoProducts.map((p) => p.name.split(' ')[0] ?? ''),
    ]),
  ]
    .filter(Boolean)
    .slice(0, 8);

  return {
    queries,
    categories: categoriesFromMock(),
    franchises: [...new Set(demoProducts.map((p) => p.franchise))],
    brands: [...new Set(demoProducts.map((p) => p.brand))].sort(),
  };
}

export class ProductRepository {
  private readonly useApi = appConfig.dataSource === 'api';

  /**
   * @param critical - orders/payments: never soft-fallback in api mode
   *   (avoids fake paid orders when the API is down).
   */
  private async withFallback<T>(
    apiCall: () => Promise<T>,
    fallback: () => T,
    options?: { critical?: boolean },
  ): Promise<T> {
    if (!this.useApi) {
      return fallback();
    }
    try {
      return await apiCall();
    } catch (error) {
      const allowSoft =
        !options?.critical && (appConfig.allowMockFallback as boolean) === true;
      if (!allowSoft) {
        throw error;
      }
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[ProductRepository] API failed; using mock fallback', error);
      }
      return fallback();
    }
  }

  async list(query: ProductListQuery = {}): Promise<ProductListResult> {
    return this.withFallback(async () => {
      const { data } = await apiClient.get('/products', { params: query });
      const payload = data.data as {
        items: unknown[];
        pagination?: { page: number; limit: number; total: number; pages: number };
        page?: number;
        limit?: number;
        total?: number;
        pages?: number;
      };
      const pagination = payload.pagination ?? payload;
      return {
        items: mapProducts(payload.items),
        page: pagination.page ?? 1,
        limit: pagination.limit ?? 20,
        total: pagination.total ?? payload.items.length,
        pages: pagination.pages ?? 1,
      };
    }, () => listFromMock(query));
  }

  async getBySlug(slug: string): Promise<Product | undefined> {
    return this.withFallback(async () => {
      const { data } = await apiClient.get(`/products/${slug}`);
      return data.data.product ? mapApiProduct(data.data.product) : undefined;
    }, () => {
      const found =
        demoProducts.find((p) => p.id === slug) ??
        demoProducts.find((p) => (p as Product & { slug?: string }).slug === slug);
      return found ? normalizeProduct(found) : undefined;
    });
  }

  async getFeatured(): Promise<Product[]> {
    return this.withFallback(async () => {
      const { data } = await apiClient.get('/products/featured');
      return mapProducts(data.data.products);
    }, () =>
      mapProducts(demoMarketplaceOverview.products.filter((p) => p.isLimitedDrop || p.rating >= 4.8)),
    );
  }

  async getLimitedDrops(): Promise<Product[]> {
    return this.withFallback(async () => {
      const { data } = await apiClient.get('/products/limited-drops');
      return mapProducts(data.data.products);
    }, () => mapProducts(demoProducts.filter((p) => p.isLimitedDrop)));
  }

  async getDeals(): Promise<Product[]> {
    return this.withFallback(async () => {
      const { data } = await apiClient.get('/products', { params: { collection: 'deals', limit: 6 } });
      const payload = data.data as { items?: unknown[]; products?: unknown[] };
      return mapProducts(payload.items ?? payload.products ?? []);
    }, () =>
      mapProducts(
        [...demoProducts]
          .sort((a, b) => b.compareAtPrice - b.price - (a.compareAtPrice - a.price))
          .slice(0, 6),
      ),
    );
  }

  async getBestSellers(): Promise<Product[]> {
    return this.withFallback(async () => {
      const { data } = await apiClient.get('/products', {
        params: { collection: 'bestsellers', limit: 6 },
      });
      const payload = data.data as { items?: unknown[]; products?: unknown[] };
      return mapProducts(payload.items ?? payload.products ?? []);
    }, () => mapProducts([...demoProducts].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 6)));
  }

  async getAlsoLike(limit = 6): Promise<Product[]> {
    return this.withFallback(async () => {
      const { data } = await apiClient.get('/products', { params: { collection: 'also-like', limit } });
      return mapProducts((data.data as ProductListResult).items);
    }, () => listFromMock({ collection: 'also-like', limit }).items);
  }

  async getRelated(product: Product): Promise<{ similar: Product[]; alsoLike: Product[] }> {
    const slug = (product as Product & { slug?: string }).slug ?? product.id;
    return this.withFallback(async () => {
      const { data } = await apiClient.get(`/products/${slug}/related`);
      return {
        similar: mapProducts(data.data.similar ?? []),
        alsoLike: mapProducts(data.data.alsoLike ?? []),
      };
    }, () => {
      const similar = mapProducts(
        demoProducts.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 8) as unknown[],
      );
      const alsoLike = mapProducts(
        demoProducts.filter((item) => item.id !== product.id && item.franchise !== product.franchise).slice(0, 8) as unknown[],
      );
      return { similar, alsoLike };
    });
  }

  async getCategories(): Promise<string[]> {
    return this.withFallback(async () => {
      const { data } = await apiClient.get('/products/categories');
      return data.data.categories;
    }, categoriesFromMock);
  }

  async getSearchSuggestions(): Promise<SearchSuggestions> {
    return this.withFallback(async () => {
      const { data } = await apiClient.get('/products/suggestions');
      return data.data;
    }, suggestionsFromMock);
  }

  async getCartQuote(items: CartQuote['items']): Promise<CartQuote> {
    return this.withFallback(async () => {
      const { data } = await apiClient.post('/cart/quote', { items });
      return data.data.quote;
    }, () => {
      let subtotal = 0;
      let itemCount = 0;
      for (const line of items) {
        const product = demoProducts.find((p) => p.id === line.productId);
        if (!product) continue;
        subtotal += product.price * line.quantity;
        itemCount += line.quantity;
      }
      const shipping = subtotal >= 1499 || subtotal === 0 ? 0 : 99;
      const tax = Math.round(subtotal * 0.05);
      return { items, subtotal, shipping, tax, total: subtotal + shipping + tax, itemCount };
    });
  }

  async createOrder(input: CreateOrderInput) {
    return this.withFallback(
      async () => {
        const { data } = await apiClient.post('/orders', input);
        const order = data.data.order as { id?: string; _id?: string };
        return {
          ...order,
          id: String(order.id ?? order._id),
        };
      },
      () => {
      let subtotal = 0;
      let itemCount = 0;
      const lines = [];
      for (const line of input.items) {
        const product = demoProducts.find((p) => p.id === line.productId);
        if (!product) continue;
        const lineTotal = product.price * line.quantity;
        subtotal += lineTotal;
        itemCount += line.quantity;
        lines.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: line.quantity,
          imageUrl: product.imageUrl,
          lineTotal,
        });
      }
      const shipping = subtotal >= 1499 ? 0 : 99;
      const tax = Math.round(subtotal * 0.05);
      const isCod = input.paymentMethod === 'cash_on_delivery';
      return {
        id: `ORD-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        orderNumber: `ORD-NDV-${Math.floor(1000 + Math.random() * 9000)}`,
        items: lines,
        subtotal,
        shipping,
        tax,
        total: subtotal + shipping + tax,
        currency: 'INR',
        status: isCod ? 'confirmed' : 'pending_payment',
        estimatedDelivery: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
        shippingAddress: input.shippingAddress,
        customer: input.customer,
        createdAt: new Date().toISOString(),
      };
    },
      { critical: true },
    );
  }

  async createPaymentIntent(orderId: string) {
    return this.withFallback(
      async () => {
        const { data } = await apiClient.post('/payments/intents', { orderId });
        return data.data.intent as {
          orderId: string;
          orderNumber: string;
          providerIntentId: string;
          keyId: string;
          amountMinor: number;
          currency: string;
          demoMode: boolean;
        };
      },
      () => ({
        orderId,
        orderNumber: orderId,
        providerIntentId: `order_demo_${Math.random().toString(36).slice(2, 10)}`,
        keyId: 'rzp_test_demo_nidavellir',
        amountMinor: 0,
        currency: 'INR',
        demoMode: true,
      }),
      { critical: true },
    );
  }

  async completeRazorpayDemo(orderId: string) {
    return this.withFallback(
      async () => {
        const { data } = await apiClient.post('/payments/razorpay/demo-complete', { orderId });
        return data.data.order;
      },
      () => ({
        id: orderId,
        status: 'paid',
      }),
      { critical: true },
    );
  }

  async confirmRazorpayPayment(input: {
    orderId: string;
    providerIntentId: string;
    providerPaymentId: string;
    signature: string;
  }) {
    return this.withFallback(
      async () => {
        const { data } = await apiClient.post('/payments/razorpay/confirm', input);
        const order = data.data.order as { id?: string; _id?: string };
        return {
          ...order,
          id: String(order.id ?? order._id ?? input.orderId),
        };
      },
      () => ({
        id: input.orderId,
        status: 'paid',
      }),
      { critical: true },
    );
  }
}

export const productRepository = new ProductRepository();
