import { appConfig } from '../../config/appConfig';
import { apiClient } from '../api/apiClient';
import { demoReviews, type ProductReview } from './reviews';

function mapReview(raw: Record<string, unknown>, productId: string): ProductReview {
  const name = String(raw.name ?? 'Shopper');
  return {
    id: String(raw._id ?? raw.id),
    productId: String(raw.productId ?? productId),
    name,
    avatarUrl:
      typeof raw.avatarUrl === 'string'
        ? raw.avatarUrl
        : `https://i.pravatar.cc/80?u=${encodeURIComponent(name)}`,
    rating: Number(raw.rating ?? 5),
    verified: Boolean(raw.verified ?? raw.userId),
    body: String(raw.body ?? ''),
    helpful: Number(raw.helpful ?? 0),
  };
}

function demoForProduct(productId: string): ProductReview[] {
  const own = demoReviews.filter((item) => item.productId === productId);
  return own.length ? own : demoReviews.slice(0, 3);
}

export const reviewRepository = {
  async listByProduct(productId: string): Promise<ProductReview[]> {
    if (appConfig.dataSource !== 'api') {
      return demoForProduct(productId);
    }
    try {
      const { data } = await apiClient.get('/reviews', { params: { productId } });
      const rows = (data.data.reviews as Record<string, unknown>[]) ?? [];
      if (!rows.length) {
        return appConfig.allowMockFallback ? demoForProduct(productId) : [];
      }
      return rows.map((row) => mapReview(row, productId));
    } catch {
      if (appConfig.allowMockFallback) return demoForProduct(productId);
      throw new Error('Could not load reviews');
    }
  },

  async create(input: {
    productId: string;
    name: string;
    rating: number;
    body: string;
  }): Promise<ProductReview> {
    if (appConfig.dataSource !== 'api') {
      return {
        id: `rev-local-${Date.now()}`,
        productId: input.productId,
        name: input.name,
        avatarUrl: `https://i.pravatar.cc/80?u=${encodeURIComponent(input.name)}`,
        rating: input.rating,
        verified: false,
        body: input.body,
        helpful: 0,
      };
    }
    const { data } = await apiClient.post('/reviews', input);
    return mapReview(data.data.review as Record<string, unknown>, input.productId);
  },
};
