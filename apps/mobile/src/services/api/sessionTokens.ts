import * as Keychain from 'react-native-keychain';
import { appConfig } from '../../config/appConfig';

const SERVICE = 'nidavellir.session';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export async function setSessionTokens(next: { accessToken: string; refreshToken?: string }) {
  accessToken = next.accessToken;
  if (next.refreshToken !== undefined) {
    refreshToken = next.refreshToken;
  }
  if (appConfig.dataSource === 'api') {
    await Keychain.setGenericPassword(
      SERVICE,
      JSON.stringify({ accessToken, refreshToken }),
      { service: SERVICE },
    );
  }
}

export async function clearSessionTokens() {
  accessToken = null;
  refreshToken = null;
  try {
    await Keychain.resetGenericPassword({ service: SERVICE });
  } catch {
    // ignore keychain errors on simulators
  }
}

export async function hydrateSessionTokensFromSecureStore(): Promise<boolean> {
  if (appConfig.dataSource !== 'api') return false;
  try {
    const creds = await Keychain.getGenericPassword({ service: SERVICE });
    if (!creds) return false;
    const parsed = JSON.parse(creds.password) as {
      accessToken?: string;
      refreshToken?: string;
    };
    if (parsed.accessToken) {
      accessToken = parsed.accessToken;
      refreshToken = parsed.refreshToken ?? null;
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
