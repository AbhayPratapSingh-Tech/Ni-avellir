import axios from 'axios';
import { appConfig } from '../../config/appConfig';
import { getAccessToken } from './sessionTokens';

/**
 * Axios instance used for live API calls.
 * Only used when `appConfig.dataSource === 'api'`.
 */
export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.error?.message ?? error?.message ?? 'Network error';
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
