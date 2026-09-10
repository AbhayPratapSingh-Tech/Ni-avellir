/**
 * Lightweight client analytics.
 * React Native logs show in the **Metro terminal** (and RN DevTools),
 * not in Chrome browser DevTools unless remote debugging is on.
 */
export function trackEvent(name: string, props?: Record<string, unknown>) {
  const payload = props ?? {};
  // warn is harder to miss in Metro / LogBox filters
  console.warn(`[analytics] ${name}`, payload);
}
