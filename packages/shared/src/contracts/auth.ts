export type AuthUserDto = {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  role?: string;
  avatarUrl?: string;
};

export type AuthTokenResponse = {
  user: AuthUserDto;
  accessToken: string;
  refreshToken: string;
};

export type OtpSendResponse = {
  sent: boolean;
  expiresInSeconds?: number;
  demoCode?: string;
};
