import axios from 'axios';
import { appConfig } from '../../config/appConfig';
import { getAccessToken, getRefreshToken, setSessionTokens } from './sessionTokens';
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
    const original = error.config;
    if (error?.response?.status === 401 && !original._retry && getRefreshToken()) {
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
          .finally(() => {
            refreshPromise = null;
          });
      }
      await refreshPromise;
      return apiClient(original);
    }
    let message = error?.response?.data?.error?.message ?? error?.message ?? 'Network error';
    if (!error?.response && error?.message === 'Network Error') {
      message =
        'Cannot reach the API server. Start it with `npm run dev:api` (port 4000) and ensure MongoDB is connected.';
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
