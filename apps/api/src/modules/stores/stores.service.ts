import { AppError } from '../../common/errors/app-error.js';
import { Store } from './stores.model.js';

const NOMINATIM_UA = 'NidavellirStoreLocator/1.0 (contact: support@nidavellir.app)';

export class StoresService {
  async list(filters: { q?: string; city?: string; state?: string }) {
    const query: Record<string, unknown> = { active: true };
    if (filters.city) {
      query.city = new RegExp(`^${escapeRegex(filters.city)}$`, 'i');
    }
    if (filters.state) {
      query.state = new RegExp(`^${escapeRegex(filters.state)}$`, 'i');
    }
    if (filters.q) {
      const needle = new RegExp(escapeRegex(filters.q), 'i');
      query.$or = [{ name: needle }, { city: needle }, { state: needle }, { address: needle }, { pincode: needle }];
    }
    const rows = await Store.find(query).sort({ city: 1, name: 1 }).lean();
    return rows.map((row) => ({
      id: String(row._id),
      name: row.name,
      address: row.address,
      city: row.city,
      state: row.state,
      pincode: row.pincode,
      lat: row.lat,
      lng: row.lng,
      phone: row.phone,
      active: row.active,
    }));
  }

  async geocode(q: string) {
    const query = q.trim();
    if (query.length < 2) {
      throw new AppError('Search query is too short', 400);
    }
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '0');

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': NOMINATIM_UA,
      },
    });
    if (!response.ok) {
      throw new AppError('Geocoding service unavailable', 502);
    }
    const results = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    const first = results[0];
    if (!first) {
      throw new AppError('No location found for that search', 404);
    }
    return {
      lat: Number(first.lat),
      lng: Number(first.lon),
      displayName: first.display_name,
    };
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const storesService = new StoresService();
