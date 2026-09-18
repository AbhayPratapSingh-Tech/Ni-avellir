import { AppError } from '../../common/errors/app-error.js';
import { Store } from './stores.model.js';

const NOMINATIM_UA =
  'NidavellirStoreLocator/1.0 (https://ni-avellir.onrender.com; support@nidavellir.app)';

type GeocodeHit = { lat: number; lng: number; displayName: string };

const FETCH_MS = 8_000;

/** Last-resort centroids when remote geocoders fail (college demo safety net). */
const BUILTIN: Record<string, GeocodeHit> = {
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

function fetchSignal() {
  return AbortSignal.timeout(FETCH_MS);
}

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

  /**
   * Free geocode chain (no API keys):
   * Open-Meteo → Photon → builtin cities → public Nominatim (often blocked on Render).
   */
  async geocode(q: string): Promise<GeocodeHit> {
    const query = q.trim();
    if (query.length < 2) {
      throw new AppError('Search query is too short', 400);
    }

    const providers: Array<() => Promise<GeocodeHit | null>> = [
      () => this.geocodeOpenMeteo(query),
      () => this.geocodePhoton(query),
      () => Promise.resolve(this.geocodeBuiltin(query)),
      () => this.geocodeNominatim(query),
    ];

    for (const run of providers) {
      const hit = await run().catch(() => null);
      if (hit) return hit;
    }

    throw new AppError('No location found for that search', 404);
  }

  private geocodeBuiltin(query: string): GeocodeHit | null {
    const key = query.toLowerCase().replace(/\s+/g, ' ').trim();
    return BUILTIN[key] ?? null;
  }

  private async geocodeOpenMeteo(query: string): Promise<GeocodeHit | null> {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', query);
    url.searchParams.set('count', '1');
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: fetchSignal(),
    });
    if (!response.ok) throw new Error(`open-meteo ${response.status}`);
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
  }

  private async geocodePhoton(query: string): Promise<GeocodeHit | null> {
    const url = new URL('https://photon.komoot.io/api/');
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: fetchSignal(),
    });
    if (!response.ok) throw new Error(`photon ${response.status}`);
    const payload = (await response.json()) as {
      features?: Array<{
        geometry?: { coordinates?: [number, number] };
        properties?: { name?: string; country?: string; city?: string; state?: string };
      }>;
    };
    const feature = payload.features?.[0];
    const coords = feature?.geometry?.coordinates;
    if (!coords || coords.length < 2) return null;
    const [lng, lat] = coords;
    const props = feature?.properties ?? {};
    const displayName =
      [props.name, props.city, props.state, props.country].filter(Boolean).join(', ') || query;
    return { lat, lng, displayName };
  }

  private async geocodeNominatim(query: string): Promise<GeocodeHit | null> {
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
      signal: fetchSignal(),
    });
    if (!response.ok) throw new Error(`nominatim ${response.status}`);
    const results = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    const first = results[0];
    if (!first) return null;
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
