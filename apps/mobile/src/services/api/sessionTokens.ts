/**
 * Session token store for live API auth.
 *
 * Today: in-memory (college demo auth is local Redux).
 * Live: wire `react-native-keychain` in set/clear so tokens survive restarts.
 *
 * `apiClient` reads `getAccessToken()` on every request when present.
 */

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function setSessionTokens(next: { accessToken: string; refreshToken?: string }) {
  accessToken = next.accessToken;
  if (next.refreshToken !== undefined) {
    refreshToken = next.refreshToken;
  }
  // Live follow-up: Keychain.setGenericPassword('nidavellir', JSON.stringify({...}))
}

export function clearSessionTokens() {
  accessToken = null;
  refreshToken = null;
  // Live follow-up: Keychain.resetGenericPassword()
}

export async function hydrateSessionTokensFromSecureStore(): Promise<void> {
  // Live follow-up: read Keychain on app launch before RootNavigator mounts.
}
