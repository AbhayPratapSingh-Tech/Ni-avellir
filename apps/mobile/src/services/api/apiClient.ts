import axios from 'axios';
import { appConfig } from '../../config/appConfig';
import { clearSessionTokens, getAccessToken, getRefreshToken, setSessionTokens } from './sessionTokens';
import { getGuestSessionId } from '../session/guestSession';

export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (appConfig.dataSource === 'api') {
    const guestId = await getGuestSessionId();
    config.headers['X-Guest-Session'] = guestId;
  }
  return config;
});

let refreshPromise: Promise<void> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as { url?: string; _retry?: boolean } | undefined;
    const url = String(original?.url ?? '');
    if (error?.response?.status === 401 && url.includes('/auth/refresh')) {
      await clearSessionTokens();
      error.displayMessage = 'Please sign in again.';
      return Promise.reject(error);
    }
    if (error?.response?.status === 401 && original && !original._retry && getRefreshToken()) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = apiClient
          .post('/auth/refresh', { refreshToken: getRefreshToken() })
          .then(({ data }) => {
            setSessionTokens({
              accessToken: data.data.accessToken,
              refreshToken: data.data.refreshToken,
            });
          })
          .catch(async (refreshError) => {
            await clearSessionTokens();
            throw refreshError;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      try {
        await refreshPromise;
      } catch {
        error.displayMessage = 'Please sign in again.';
        return Promise.reject(error);
      }
      return apiClient(original);
    }
    let message = error?.response?.data?.error?.message ?? error?.message ?? 'Network error';
    if (!error?.response && error?.message === 'Network Error') {
      message =
        appConfig.appEnvironment === 'local'
          ? 'Cannot reach the API server. Start it with `npm run dev:api` (port 4000) and ensure MongoDB is connected.'
          : 'Cannot reach the shop right now. Try again in a moment.';
    }
    error.displayMessage = message;
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'displayMessage' in error) {
    return String((error as { displayMessage?: string }).displayMessage);
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
