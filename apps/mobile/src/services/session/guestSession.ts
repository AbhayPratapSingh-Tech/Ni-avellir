import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_SESSION_KEY = 'nidavellir_guest_session';

let cachedGuestSession: string | null = null;

function randomGuestId() {
  return `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function getGuestSessionId(): Promise<string> {
  if (cachedGuestSession) return cachedGuestSession;
  const stored = await AsyncStorage.getItem(GUEST_SESSION_KEY);
  if (stored) {
    cachedGuestSession = stored;
    return stored;
  }
  const next = randomGuestId();
  await AsyncStorage.setItem(GUEST_SESSION_KEY, next);
  cachedGuestSession = next;
  return next;
}

export async function clearGuestSessionId(): Promise<void> {
  cachedGuestSession = null;
  await AsyncStorage.removeItem(GUEST_SESSION_KEY);
}
