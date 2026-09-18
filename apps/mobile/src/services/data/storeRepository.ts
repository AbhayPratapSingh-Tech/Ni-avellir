import type { GeocodeResult, StoreLocation } from '@nidavellir/shared';
import { appConfig } from '../../config/appConfig';
import { apiClient } from '../api/apiClient';

export type StoreListQuery = {
  q?: string;
  city?: string;
  state?: string;
};

/** Last-resort centroids when API + Open-Meteo fail. */
const BUILTIN: Record<string, GeocodeResult> = {
  india: { lat: 20.5937, lng: 78.9629, displayName: 'India' },
  jaipur: { lat: 26.9124, lng: 75.7873, displayName: 'Jaipur, Rajasthan, India' },
  mumbai: { lat: 19.076, lng: 72.8777, displayName: 'Mumbai, Maharashtra, India' },
  delhi: { lat: 28.6139, lng: 77.209, displayName: 'New Delhi, India' },
  'new delhi': { lat: 28.6139, lng: 77.209, displayName: 'New Delhi, India' },
  bengaluru: { lat: 12.9716, lng: 77.5946, displayName: 'Bengaluru, Karnataka, India' },
  bangalore: { lat: 12.9716, lng: 77.5946, displayName: 'Bengaluru, Karnataka, India' },
  hyderabad: { lat: 17.385, lng: 78.4867, displayName: 'Hyderabad, Telangana, India' },
  chennai: { lat: 13.0827, lng: 80.2707, displayName: 'Chennai, Tamil Nadu, India' },
  kolkata: { lat: 22.5726, lng: 88.3639, displayName: 'Kolkata, West Bengal, India' },
  pune: { lat: 18.5204, lng: 73.8567, displayName: 'Pune, Maharashtra, India' },
  ahmedabad: { lat: 23.0225, lng: 72.5714, displayName: 'Ahmedabad, Gujarat, India' },
  chandigarh: { lat: 30.7333, lng: 76.7794, displayName: 'Chandigarh, India' },
  goa: { lat: 15.2993, lng: 74.124, displayName: 'Goa, India' },
  'new york': { lat: 40.7128, lng: -74.006, displayName: 'New York, USA' },
  london: { lat: 51.5074, lng: -0.1278, displayName: 'London, UK' },
};

async function geocodeOpenMeteo(query: string): Promise<GeocodeResult | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      results?: Array<{
        name: string;
        latitude: number;
        longitude: number;
        country?: string;
        admin1?: string;
      }>;
    };
    const first = payload.results?.[0];
    if (!first) return null;
    return {
      lat: first.latitude,
      lng: first.longitude,
      displayName: [first.name, first.admin1, first.country].filter(Boolean).join(', '),
    };
  } catch {
    return null;
  }
}

function geocodeBuiltin(query: string): GeocodeResult | null {
  const key = query.toLowerCase().replace(/\s+/g, ' ').trim();
  return BUILTIN[key] ?? null;
}

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

  /**
   * Prefer API geocode (Open-Meteo chain on server). If API is down / old deploy,
   * fall back to device Open-Meteo then builtin cities — no paid map key.
   */
  async geocode(q: string): Promise<GeocodeResult | null> {
    const query = q.trim();
    if (query.length < 2) return null;

    if (appConfig.dataSource === 'api') {
      try {
        const { data } = await apiClient.get('/stores/geocode', { params: { q: query } });
        if (data?.data?.lat != null && data?.data?.lng != null) {
          return data.data as GeocodeResult;
        }
      } catch {
        // Fall through — e.g. Render still on Nominatim-only build.
      }
    }

    return (await geocodeOpenMeteo(query)) ?? geocodeBuiltin(query);
  },
};
