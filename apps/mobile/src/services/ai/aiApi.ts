import type { AIChatRequest, AIProductCard, AIResponse, Product } from '@nidavellir/shared';
import { apiClient } from '../api/apiClient';
import { normalizeProduct } from '../../lib/productMedia';

export function mapAiProduct(raw: AIProductCard | Record<string, unknown>): Product {
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? r._id ?? '');
  const franchise = String(r.franchise ?? '');
  return normalizeProduct({
    ...(r as unknown as Product),
    id,
    brand: String(r.brand ?? franchise),
    franchise,
    stock: Number(r.stock ?? (r.inStock ? 1 : 0)),
    imageUrl: String(r.imageUrl ?? ''),
    imageUrls: Array.isArray(r.imageUrls)
      ? (r.imageUrls as string[])
      : r.imageUrl
        ? [String(r.imageUrl)]
        : [],
  });
}

export const aiApi = {
  async sendMessage(request: AIChatRequest): Promise<AIResponse> {
    const { data } = await apiClient.post('/ai/chat', request, { timeout: 60_000 });
    return data.data as AIResponse;
  },
};

export function productsFromAiResponse(response: AIResponse): Product[] {
  if (response.type === 'product_results') {
    return response.products.map((p) => mapAiProduct(p));
  }
  if (response.type === 'wishlist') {
    return response.wishlist.products.map((p) => mapAiProduct(p));
  }
  return [];
}

export function friendlyAiError(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 401) return 'Please sign in to continue with that action.';
  if (status === 503) return 'Heimdall is temporarily unavailable. Please try again soon.';
  if ((error as { code?: string })?.code === 'ECONNABORTED') {
    return 'That took too long. Please try again.';
  }
  return "Sorry, Heimdall couldn't reply right now. Please try again.";
}
