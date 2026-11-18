import AsyncStorage from '@react-native-async-storage/async-storage';
import { appConfig } from '../../config/appConfig';

function guestSessionKey() {
  return `nidavellir_guest_session.${appConfig.appEnvironment}`;
}

let cachedGuestSession: string | null = null;

function randomGuestId() {
  return `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function getGuestSessionId(): Promise<string> {
  if (cachedGuestSession) return cachedGuestSession;
  const stored = await AsyncStorage.getItem(guestSessionKey());
  if (stored) {
    cachedGuestSession = stored;
    return stored;
  }
  const next = randomGuestId();
  await AsyncStorage.setItem(guestSessionKey(), next);
  cachedGuestSession = next;
  return next;
}

export async function clearGuestSessionId(): Promise<void> {
  cachedGuestSession = null;
  await AsyncStorage.removeItem(guestSessionKey());
}
