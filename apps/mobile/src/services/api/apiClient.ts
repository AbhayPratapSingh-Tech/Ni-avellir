import axios from 'axios';
import { appConfig } from '../../config/appConfig';

/**
 * Axios instance used for live API calls.
 * Only used when `appConfig.dataSource === 'api'`.
 */
export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to surface API error messages consistently.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.error?.message ?? error?.message ?? 'Network error';
    error.displayMessage = message;
    return Promise.reject(error);
  },
);
