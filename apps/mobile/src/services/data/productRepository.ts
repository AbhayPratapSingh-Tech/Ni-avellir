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
  collection?: 'bestsellers' | 'deals' | 'also-like';
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
}

function listFromMock(query: ProductListQuery = {}): ProductListResult {
  let items = demoProducts.map(normalizeProduct);
  if (query.category) {
    items = items.filter((p) => p.category === query.category);
  }
  if (query.franchise) {
    items = items.filter((p) => p.franchise === query.franchise);
  }
  if (query.search) {
    const q = query.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.franchise.toLowerCase().includes(q) ||
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

function mapProducts(items: Product[] = []): Product[] {
  return items.map(normalizeProduct);
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
  };
}

export class ProductRepository {
  private readonly useApi = appConfig.dataSource === 'api';

  private async withFallback<T>(apiCall: () => Promise<T>, fallback: () => T): Promise<T> {
    if (!this.useApi) {
      return fallback();
    }
    try {
      return await apiCall();
    } catch {
      return fallback();
    }
  }

  async list(query: ProductListQuery = {}): Promise<ProductListResult> {
    return this.withFallback(async () => {
      const { data } = await apiClient.get('/products', { params: query });
      const result = data.data as ProductListResult;
      return { ...result, items: mapProducts(result.items) };
    }, () => listFromMock(query));
  }

  async getBySlug(slug: string): Promise<Product | undefined> {
    return this.withFallback(async () => {
      const { data } = await apiClient.get(`/products/${slug}`);
      return data.data.product ? normalizeProduct(data.data.product) : undefined;
    }, () => {
      const found = demoProducts.find((p) => p.id === slug);
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
      const { data } = await apiClient.get('/products/deals');
      return mapProducts(data.data.products);
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
      const { data } = await apiClient.get('/products/best-sellers');
      return mapProducts(data.data.products);
    }, () => mapProducts([...demoProducts].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 6)));
  }

  async getAlsoLike(limit = 6): Promise<Product[]> {
    return this.withFallback(async () => {
      const { data } = await apiClient.get('/products', { params: { collection: 'also-like', limit } });
      return mapProducts((data.data as ProductListResult).items);
    }, () => listFromMock({ collection: 'also-like', limit }).items);
  }

  async getRelated(product: Product): Promise<{ similar: Product[]; alsoLike: Product[] }> {
    const similar = mapProducts(
      demoProducts.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 8),
    );
    const alsoLike = mapProducts(
      demoProducts.filter((item) => item.id !== product.id && item.franchise !== product.franchise).slice(0, 8),
    );
    return { similar, alsoLike };
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
    return this.withFallback(async () => {
      const { data } = await apiClient.post('/orders', input);
      return data.data.order;
    }, () => {
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
      return {
        id: `ORD-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        orderNumber: `ORD-NDV-${Math.floor(1000 + Math.random() * 9000)}`,
        items: lines,
        subtotal,
        shipping,
        tax,
        total: subtotal + shipping + tax,
        currency: 'INR',
        status: input.paymentMethod === 'cash_on_delivery' ? 'confirmed' : 'paid',
        estimatedDelivery: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
        shippingAddress: input.shippingAddress,
        customer: input.customer,
        createdAt: new Date().toISOString(),
      };
    });
  }
}

export const productRepository = new ProductRepository();
