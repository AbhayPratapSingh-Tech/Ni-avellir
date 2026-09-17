import type { GeocodeResult, StoreLocation } from '@nidavellir/shared';
import { appConfig } from '../../config/appConfig';
import { apiClient } from '../api/apiClient';

export type StoreListQuery = {
  q?: string;
  city?: string;
  state?: string;
};

export const storeRepository = {
  async list(query: StoreListQuery = {}): Promise<StoreLocation[]> {
    if (appConfig.dataSource !== 'api') {
      return [];
    }
    try {
      const { data } = await apiClient.get('/stores', { params: query });
      return (data.data?.stores ?? []) as StoreLocation[];
    } catch {
      return [];
    }
  },

  async geocode(q: string): Promise<GeocodeResult | null> {
    const query = q.trim();
    if (query.length < 2) return null;
    if (appConfig.dataSource !== 'api') {
      return null;
    }
    try {
      const { data } = await apiClient.get('/stores/geocode', { params: { q: query } });
      return data.data as GeocodeResult;
    } catch {
      return null;
    }
  },
};
