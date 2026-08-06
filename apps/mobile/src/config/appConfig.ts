/**
 * Central app configuration.
 *
 * To switch data sources:
 *   - `mock`  -> uses bundled mock data (no server needed, great for demos).
 *   - `api`   -> uses the live backend API (requires the API + MongoDB running).
 *
 * Change `DATA_SOURCE` to flip the entire app between modes.
 */
export type DataSourceMode = 'mock' | 'api';

export const appConfig = {
  /** Flip this to 'api' to use the live backend. */
  dataSource: 'api' as DataSourceMode,

  /** Base URL of the API server (used only when dataSource === 'api'). */
  apiBaseUrl: 'http://localhost:4000/api/v1',

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
} as const;

export type AppConfig = typeof appConfig;
