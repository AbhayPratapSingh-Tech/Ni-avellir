import type { Product } from '@nidavellir/shared';
import { appConfig } from '../../config/appConfig';
import { apiClient } from '../api/apiClient';
import { store } from '../../app/store';
import { setWishlist } from '../../features/wishlist/wishlistSlice';
import { normalizeProduct } from '../../lib/productMedia';

function mapProduct(raw: Record<string, unknown>): Product {
  const id = String(raw._id ?? raw.id);
  const franchise = String(raw.franchise ?? '');
  return normalizeProduct({
    ...(raw as Product),
    id,
    brand: String(raw.brand ?? franchise),
    franchise,
  });
}

export const wishlistRepository = {
  async syncToStore() {
    if (appConfig.dataSource !== 'api') return;
    const { data } = await apiClient.get('/wishlist');
    store.dispatch(setWishlist((data.data.products as Record<string, unknown>[]).map(mapProduct)));
  },

  async toggle(productId: string) {
    if (appConfig.dataSource !== 'api') return null;
    const { data } = await apiClient.post('/wishlist/toggle', { productId });
    await this.syncToStore();
    return data.data as { added: boolean };
  },

  async remove(productId: string) {
    if (appConfig.dataSource !== 'api') return;
    await apiClient.delete(`/wishlist/${productId}`);
    await this.syncToStore();
  },
};
