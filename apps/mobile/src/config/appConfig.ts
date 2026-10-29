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

/** Render Free API (production/staging test). Swap to `localApiBaseUrl` for laptop API. */
const liveApiBaseUrl = 'https://ni-avellir.onrender.com/api/v1';

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
  apiBaseUrl: liveApiBaseUrl,

  /**
   * Render Free cold-start mitigation (api mode only).
   * Silent GET `/health` on bootstrap + every interval while the app is foregrounded.
   */
  apiKeepAliveIntervalMs: 20 * 60 * 1000,
  /** Health ping timeout — cold starts can exceed the normal 15s apiClient timeout. */
  apiHealthTimeoutMs: 90_000,

  /** Currency formatting defaults. */
  currency: 'INR',

  /**
   * Google Apps Script Web App URLs (Deploy → Web app, Anyone).
   * Contact tab: "Contact Nidavellir".
   * Support tabs: "Support Tickets" + "Support Commerce" + "Support Account App".
   * Leave empty until you paste your deployed URLs — forms will toast a config message.
   */
  contactFormWebhookUrl:
    'https://script.google.com/macros/s/AKfycbzmcU-UVsQwypWl1JS8Tct16Z7ynSD6O5sQxQR3q-6h5rP-7RHHk5SAuGuM_19QcODJWg/exec',
  supportFormWebhookUrl:
    'https://script.google.com/macros/s/AKfycbwLLk0WPQ36lcXdB9wJg0Wl7mYmMBklHjjAeT5mnPl-1pizmPMqMlGsSgZBeL7x-UxomQ/exec',

  /** Feature flags. */
  features: {
    forgeStudio: true,
    runeXp: true,
    heroCarousel: true,
    flashSale: true,
    aiAssistant: true,
    voiceInput: true,
    storeLocator: true,
    /** Game-lobby 3D Character Vault (requires native rebuild after Filament install). */
    characterVault: true,
    /** Camera/gallery → vision LLM → catalog search (needs live API + OPENAI_*). */
    visualSearch: true,
    /** Home For you rail from recent views + wishlist + orders. */
    personalizedHome: true,
  },

  /**
   * Home video banner — plays in-app via WebView (youtubeId). Starts muted autoplay on Home.
   */
  videoBanner: {
    youtubeId: 'xOtGHc0FPmg',
    uri: 'https://youtu.be/xOtGHc0FPmg?si=s8M-mIjDoYqk56Yv',
    poster:
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1400&q=80',
  },
} as const;

export type AppConfig = typeof appConfig;

/** True when the app should talk to the Express API. */
export function isApiMode() {
  return appConfig.dataSource === 'api';
}
