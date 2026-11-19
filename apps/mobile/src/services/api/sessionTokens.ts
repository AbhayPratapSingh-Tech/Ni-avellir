import * as Keychain from 'react-native-keychain';
import { appConfig } from '../../config/appConfig';

const LEGACY_SERVICE = 'nidavellir.session';

/** Production, UAT, and local sign-ins stay in separate Keychain entries. */
function sessionService() {
  return `${LEGACY_SERVICE}.${appConfig.appEnvironment}`;
}

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
      'nidavellir',
      JSON.stringify({ accessToken, refreshToken }),
      { service: sessionService() },
    );
  }
}

export async function clearSessionTokens() {
  accessToken = null;
  refreshToken = null;
  try {
    await Keychain.resetGenericPassword({ service: sessionService() });
  } catch {
    // ignore keychain errors on simulators
  }
}

export async function hydrateSessionTokensFromSecureStore(): Promise<boolean> {
  if (appConfig.dataSource !== 'api') return false;
  try {
    let creds = await Keychain.getGenericPassword({ service: sessionService() });
    let fromLegacy = false;
    if (!creds && appConfig.appEnvironment === 'production') {
      creds = await Keychain.getGenericPassword({ service: LEGACY_SERVICE });
      fromLegacy = Boolean(creds);
    }
    if (!creds) return false;
    const parsed = JSON.parse(creds.password) as {
      accessToken?: string;
      refreshToken?: string;
    };
    if (parsed.accessToken) {
      accessToken = parsed.accessToken;
      refreshToken = parsed.refreshToken ?? null;
      if (fromLegacy) {
        await Keychain.setGenericPassword(creds.username, creds.password, {
          service: sessionService(),
        });
        await Keychain.resetGenericPassword({ service: LEGACY_SERVICE });
      }
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
