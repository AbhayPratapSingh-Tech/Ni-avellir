import axios from 'axios';
import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import { appConfig, isApiMode } from '../../config/appConfig';

const healthClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: appConfig.apiHealthTimeoutMs,
  headers: {
    Accept: 'application/json',
  },
});

let intervalId: ReturnType<typeof setInterval> | null = null;
let appStateSub: NativeEventSubscription | null = null;
let started = false;

/** Silent GET /health — wakes Render Free cold starts; errors are ignored. */
export async function pingApiHealth(): Promise<void> {
  if (!isApiMode()) return;
  try {
    await healthClient.get('/health');
  } catch {
    // Offline or still waking — do not surface to UI.
  }
}

function clearIntervalOnly() {
  if (intervalId != null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function startInterval() {
  clearIntervalOnly();
  intervalId = setInterval(() => {
    void pingApiHealth();
  }, appConfig.apiKeepAliveIntervalMs);
}

function onAppStateChange(next: AppStateStatus) {
  if (next === 'active') {
    void pingApiHealth();
    startInterval();
    return;
  }
  clearIntervalOnly();
}

/**
 * While the app is in the foreground, ping /health every `apiKeepAliveIntervalMs`
 * so a free Render instance is less likely to sleep mid-session.
 */
export function startApiKeepAlive(): void {
  if (!isApiMode() || started) return;
  started = true;
  startInterval();
  appStateSub = AppState.addEventListener('change', onAppStateChange);
}

export function stopApiKeepAlive(): void {
  clearIntervalOnly();
  appStateSub?.remove();
  appStateSub = null;
  started = false;
}
