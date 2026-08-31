import { Platform } from 'react-native';

/**
 * Central app configuration — single switchboard for mock vs live API.
 *
 * LIVE SWITCH (when backend + Mongo are ready):
 *   1. Set `dataSource` to `'api'`
 *   2. Set `apiBaseUrl` to staging/production HTTPS `/api/v1`
 *   3. Set `allowMockFallback` to `false` so failed API calls surface errors
 *      instead of silently using demo catalog / fake orders
 *   4. Restart Metro + rebuild if native modules changed
 *
 * See `AI_AGENT_GUIDE.md` and `PROJECT_INSIGHTS.md`.
 */
export type DataSourceMode = 'mock' | 'api';

const apiHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const appConfig = {
  /**
   * `mock` — bundled demo data (college demo, no server).
   * `api`  — Express `/api/v1` (requires API + Mongo running).
   */
  dataSource: 'api' as DataSourceMode,

  /**
   * When `dataSource === 'api'` and a request fails:
   * - `true`  → catalog helpers may fall back to demo products (dev convenience)
   * - `false` → throw (required for staging/production / live payments)
   *
   * Money paths (orders + payments) never soft-fallback in `api` mode.
   */
  allowMockFallback: false,

  /** Base URL of the API server (used only when dataSource === 'api'). */
  apiBaseUrl: `http://${apiHost}:4000/api/v1`,

  /** Currency formatting defaults. */
  currency: 'INR',

  /** Feature flags. */
  features: {
    forgeStudio: true,
    runeXp: true,
    heroCarousel: true,
    flashSale: true,
  },

  /**
   * Home video banner under Live Drop.
   * Paste the clip URL here when you have it (`uri`). Poster shows until then.
   */
  videoBanner: {
    uri: '',
    poster:
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1400&q=80',
  },
} as const;

export type AppConfig = typeof appConfig;

/** True when the app should talk to the Express API. */
export function isApiMode() {
  return appConfig.dataSource === 'api';
}
