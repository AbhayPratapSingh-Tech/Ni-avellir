import type { Product } from '@nidavellir/shared';
import { appConfig } from '../../config/appConfig';
import { apiClient } from '../api/apiClient';
import { store } from '../../app/store';
import { setWishlist } from '../../features/wishlist/wishlistSlice';
import { normalizeProduct } from '../../lib/productMedia';

function mapWishlistProduct(raw: Record<string, unknown>): Product {
  const mongoId = raw._id != null ? String(raw._id) : '';
  const fallbackId = raw.id != null ? String(raw.id) : '';
  const id = mongoId || fallbackId;
  const franchise = String(raw.franchise ?? '');
  const imageUrl = String(raw.imageUrl ?? '');
  const galleryUrls = Array.isArray(raw.galleryUrls)
    ? (raw.galleryUrls as unknown[]).map(String).filter(Boolean)
    : [];
  const explicitUrls = Array.isArray(raw.imageUrls)
    ? (raw.imageUrls as unknown[]).map(String).filter(Boolean)
    : [];
  const imageUrls =
    explicitUrls.length > 0
      ? explicitUrls
      : [...new Set([imageUrl, ...galleryUrls].filter(Boolean))];

  return normalizeProduct({
    ...(raw as Product),
    id,
    brand: String(raw.brand ?? franchise),
    franchise,
    imageUrl: imageUrl || imageUrls[0] || '',
    imageUrls,
    sku: raw.sku ? String(raw.sku) : (undefined as unknown as string),
    runeXp: raw.runeXp !== undefined ? Number(raw.runeXp) : (undefined as unknown as number),
    compareAtPrice:
      raw.compareAtPrice !== undefined ? Number(raw.compareAtPrice) : (undefined as unknown as number),
  });
}

export const wishlistRepository = {
  async syncToStore() {
    if (appConfig.dataSource !== 'api') return;
    const { data } = await apiClient.get('/wishlist');
    const products = ((data.data.products as Record<string, unknown>[]) ?? []).map(mapWishlistProduct);
    store.dispatch(setWishlist(products));
  },

  async toggle(productId: string) {
    if (appConfig.dataSource !== 'api') return null;
    const { data } = await apiClient.post('/wishlist/toggle', { productId });
    await this.syncToStore();
    return data.data as { added: boolean; productId?: string };
  },

  async remove(productId: string) {
    if (appConfig.dataSource !== 'api') return;
    await apiClient.delete(`/wishlist/${encodeURIComponent(productId)}`);
    await this.syncToStore();
  },
};
