import { Platform } from 'react-native';

/**
 * Central app configuration.
 *
 * To switch data sources:
 *   - `mock`  -> uses bundled demo data instantly (no server needed).
 *   - `api`   -> uses the live backend API (requires the API running).
 *
 * Android emulator reaches the host machine at 10.0.2.2, not localhost.
 */
export type DataSourceMode = 'mock' | 'api';

const apiHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const appConfig = {
  /** Catalog uses mock data so the shop works without a running API. */
  dataSource: 'mock' as DataSourceMode,

  /** Base URL of the API server (used only when dataSource === 'api'). */
  apiBaseUrl: `http://${apiHost}:4000/api/v1`,

  /** Currency formatting defaults. */
  currency: 'INR',

  /** Feature flags. */
  features: {
    /** Show the Forge customizer experimental feature. */
    forgeStudio: true,
    /** Show the Rune XP loyalty gamification widget. */
    runeXp: true,
    /** Show animated hero carousel. */
    heroCarousel: true,
    /** Show the flash-sale countdown. */
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
