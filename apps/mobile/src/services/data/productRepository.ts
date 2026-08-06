import { appConfig } from '../../config/appConfig';
import { demoMarketplaceOverview, demoProducts } from '@nidavellir/shared';
import type { Product } from '@nidavellir/shared';
import { apiClient } from '../api/apiClient';

/**
 * ProductRepository abstracts the data source.
 *
 * - In `mock` mode it returns bundled demo data instantly (no network).
 * - In `api` mode it calls the live backend.
 *
 * Swap `appConfig.dataSource` to switch globally.
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
  search?: string;
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

export class ProductRepository {
  private readonly useApi = appConfig.dataSource === 'api';

  async list(query: ProductListQuery = {}): Promise<ProductListResult> {
    if (this.useApi) {
      const { data } = await apiClient.get('/products', { params: query });
      return data.data;
    }

    // Mock filtering/sorting/pagination.
    let items = [...demoProducts];
    if (query.category) {
      items = items.filter((p) => p.category === query.category);
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.franchise.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
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
      pages: Math.ceil(total / limit),
    };
  }

  async getBySlug(slug: string): Promise<Product | undefined> {
    if (this.useApi) {
      const { data } = await apiClient.get(`/products/${slug}`);
      return data.data.product;
    }
    return demoProducts.find((p) => p.id === slug);
  }

  async getFeatured(): Promise<Product[]> {
    if (this.useApi) {
      const { data } = await apiClient.get('/products/featured');
      return data.data.products;
    }
    return demoMarketplaceOverview.products.filter((p) => p.isLimitedDrop || p.rating >= 4.8);
  }

  async getLimitedDrops(): Promise<Product[]> {
    if (this.useApi) {
      const { data } = await apiClient.get('/products/limited-drops');
      return data.data.products;
    }
    return demoProducts.filter((p) => p.isLimitedDrop);
  }

  async getCategories(): Promise<string[]> {
    if (this.useApi) {
      const { data } = await apiClient.get('/products/categories');
      return data.data.categories;
    }
    return ['collectibles', 'apparel', 'desk-gear', 'limited-drops'];
  }

  async getCartQuote(items: CartQuote['items']): Promise<CartQuote> {
    if (this.useApi) {
      const { data } = await apiClient.post('/cart/quote', { items });
      return data.data.quote;
    }

    // Mock quote calculation.
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
  }

  async createOrder(input: CreateOrderInput) {
    if (this.useApi) {
      const { data } = await apiClient.post('/orders', input);
      return data.data.order;
    }

    // Mock order creation.
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
  }
}

export const productRepository = new ProductRepository();
