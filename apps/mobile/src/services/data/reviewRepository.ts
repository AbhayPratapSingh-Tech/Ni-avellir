import { appConfig } from '../../config/appConfig';
import type { AuthUser } from '../../features/auth/authSlice';
import { apiClient } from '../api/apiClient';
import { demoReviews, reviewDisplayTitle, type ProductReview } from './reviews';

function isRemoteImageUrl(uri?: string) {
  if (!uri) return false;
  return uri.startsWith('https://') || uri.startsWith('http://');
}

export function isDisplayAvatarUrl(uri?: string) {
  if (!uri?.trim()) return false;
  const value = uri.trim();
  return (
    value.startsWith('https://') ||
    value.startsWith('http://') ||
    value.startsWith('data:image/') ||
    value.startsWith('file:') ||
    value.startsWith('content:')
  );
}

function mapReview(raw: Record<string, unknown>, productId: string): ProductReview {
  const name = String(raw.name ?? 'Shopper');
  const body = String(raw.body ?? '');
  const title = reviewDisplayTitle({ title: String(raw.title ?? ''), body });
  const imageUrl = typeof raw.imageUrl === 'string' && isRemoteImageUrl(raw.imageUrl) ? raw.imageUrl : undefined;
  const userId = raw.userId != null ? String(raw.userId) : undefined;
  return {
    id: String(raw._id ?? raw.id),
    productId: String(raw.productId ?? productId),
    userId,
    name,
    avatarUrl: isDisplayAvatarUrl(typeof raw.avatarUrl === 'string' ? raw.avatarUrl : undefined)
      ? String(raw.avatarUrl).trim()
      : '',
    rating: Number(raw.rating ?? 5),
    verified: Boolean(raw.verified ?? raw.userId),
    title,
    body,
    helpful: Number(raw.helpful ?? 0),
    imageUrl,
  };
}

function demoForProduct(productId: string): ProductReview[] {
  const own = demoReviews.filter((item) => item.productId === productId);
  return own.length ? own : demoReviews.slice(0, 3);
}

export function isOwnReview(review: ProductReview, user: AuthUser | null | undefined): boolean {
  if (!user || user.isGuest) return false;
  if (user.id && review.userId && user.id === review.userId) return true;
  if (user.email && review.userId && user.email === review.userId) return true;
  return false;
}

/** Prefer the signed-in profile photo on that shopper's own rows. */
export function withViewerAvatar(reviews: ProductReview[], user: AuthUser | null | undefined): ProductReview[] {
  if (!user || user.isGuest || !isDisplayAvatarUrl(user.avatarUri)) {
    return reviews;
  }
  return reviews.map((review) =>
    isOwnReview(review, user) ? { ...review, avatarUrl: user.avatarUri!.trim() } : review,
  );
}

export type CreateReviewInput = {
  productId: string;
  name: string;
  rating: number;
  title: string;
  body: string;
  userId?: string;
  avatarUrl?: string;
  imageUrl?: string;
};

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

  async create(input: CreateReviewInput): Promise<ProductReview> {
    const title = input.title.trim().slice(0, 70);
    const remoteImage = isRemoteImageUrl(input.imageUrl) ? input.imageUrl : undefined;
    const avatarUrl = isDisplayAvatarUrl(input.avatarUrl) ? input.avatarUrl!.trim() : '';
    const userId = input.userId?.trim() || undefined;
    if (appConfig.dataSource !== 'api') {
      return {
        id: `rev-local-${Date.now()}`,
        productId: input.productId,
        userId,
        name: input.name,
        avatarUrl,
        rating: input.rating,
        verified: false,
        title,
        body: input.body,
        helpful: 0,
        imageUrl: remoteImage,
      };
    }
    const persistedAvatar =
      isRemoteImageUrl(avatarUrl) || avatarUrl.startsWith('data:image/') ? avatarUrl : undefined;
    const { data } = await apiClient.post('/reviews', {
      productId: input.productId,
      name: input.name,
      rating: input.rating,
      title,
      body: input.body,
      ...(persistedAvatar ? { avatarUrl: persistedAvatar } : {}),
      ...(remoteImage ? { imageUrl: remoteImage } : {}),
    });
    const mapped = mapReview(data.data.review as Record<string, unknown>, input.productId);
    if (!mapped.avatarUrl && avatarUrl) {
      mapped.avatarUrl = avatarUrl;
    }
    if (!mapped.userId && userId) {
      mapped.userId = userId;
    }
    return mapped;
  },

  async remove(reviewId: string): Promise<void> {
    if (appConfig.dataSource !== 'api') {
      return;
    }
    await apiClient.delete(`/reviews/${reviewId}`);
  },
};
