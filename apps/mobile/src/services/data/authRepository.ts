import { apiClient, getApiErrorMessage } from '../api/apiClient';
import { setSessionTokens, clearSessionTokens, getRefreshToken } from '../api/sessionTokens';
import { appConfig } from '../../config/appConfig';
import { getGuestSessionId } from '../session/guestSession';
import { cartRepository } from './cartRepository';
import { addressRepository } from './addressRepository';
import { orderRepository } from './orderRepository';
import { wishlistRepository } from './wishlistRepository';

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  avatarUrl?: string;
};

async function postLoginSync(refreshToken?: string) {
  const guestId = await getGuestSessionId();
  await cartRepository.merge(guestId);
  await Promise.all([
    addressRepository.syncToStore(),
    orderRepository.syncToStore(),
    wishlistRepository.syncToStore(),
  ]);
  if (refreshToken) {
    // merge already uses auth header
  }
}

export const authRepository = {
  async register(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{
    user: ApiUser;
    emailVerification?: { sent?: boolean; demoCode?: string };
  }> {
    const { data } = await apiClient.post('/auth/register', input);
    return {
      user: data.data.user,
      emailVerification: data.data.emailVerification,
    };
  },

  async checkRegistration(input: { email: string; phone: string }) {
    const { data } = await apiClient.post('/auth/register/check', input);
    return data.data as {
      emailAvailable: boolean;
      phoneAvailable: boolean;
      emailMessage?: string;
      phoneMessage?: string;
    };
  },

  async verifyEmailAndLogin(email: string, code: string, password: string): Promise<ApiUser> {
    await apiClient.post('/auth/verify-email', { email, code });
    return this.login(email, password);
  },

  async resendVerifyEmail(email: string) {
    const { data } = await apiClient.post('/auth/verify-email/resend', { email });
    return data.data as { sent?: boolean; demoCode?: string; alreadyVerified?: boolean };
  },

  async login(email: string, password: string): Promise<ApiUser> {
    const { data } = await apiClient.post('/auth/login', { email, password });
    await setSessionTokens({
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    });
    await postLoginSync(data.data.refreshToken);
    return data.data.user;
  },

  async sendOtp(phone: string, purpose = 'login') {
    const { data } = await apiClient.post('/auth/otp/send', { phone, purpose });
    return data.data as { sent: boolean; demoCode?: string };
  },

  async verifyOtp(input: {
    phone: string;
    code: string;
    name?: string;
    email?: string;
  }): Promise<ApiUser> {
    const { data } = await apiClient.post('/auth/otp/verify', input);
    await setSessionTokens({
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    });
    await postLoginSync(data.data.refreshToken);
    return data.data.user;
  },

  async me(): Promise<ApiUser | null> {
    if (appConfig.dataSource !== 'api') return null;
    try {
      const { data } = await apiClient.get('/auth/me');
      return data.data.user;
    } catch {
      return null;
    }
  },

  async updateProfile(input: Partial<{ name: string; email: string; avatarUrl: string }>) {
    const { data } = await apiClient.patch('/auth/me', input);
    return data.data.user as ApiUser;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout', { refreshToken: getRefreshToken() });
    } catch {
      // ignore
    }
    await clearSessionTokens();
  },

  async forgotPassword(email: string) {
    const { data } = await apiClient.post('/auth/forgot-password', { email });
    return data.data;
  },

  async resetPassword(email: string, code: string, password: string) {
    const { data } = await apiClient.post('/auth/reset-password', { email, code, password });
    return data.data;
  },

  getApiErrorMessage,
};
