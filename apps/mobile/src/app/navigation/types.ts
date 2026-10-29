import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Product } from '@nidavellir/shared';

export type MainTabParamList = {
  Home: undefined;
  Categories: undefined;
  Cart: undefined;
  Account: undefined;
};

/** Shared help screens (registered on both Auth + Shop stacks). */
export type RaiseQueryParams = { orderId?: string; category?: string } | undefined;

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email?: string } | undefined;
  Otp: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    purpose?: 'login' | 'verify_email';
    /** Shown on-screen when API email demo mode is active (no real mail sent). */
    devVerifyCode?: string;
  };
  AuthSuccess: {
    name: string;
    email: string;
    phone: string;
    userId?: string;
    avatarUri?: string;
    runeXp?: number;
    emailVerified?: boolean;
  };
  /** Reachable from Login / Signup Need Help without entering the shop. */
  Faq: undefined;
  Returns: undefined;
  Contact: undefined;
  Support: undefined;
  RaiseQuery: RaiseQueryParams;
  SupportQueryDetail: { queryId: string };
  PrivacyPolicy: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Products: {
    category?: string;
    /** Exact tag facet (e.g. anime). */
    tag?: string;
    q?: string;
    franchise?: string;
    collection?: 'bestsellers' | 'deals' | 'also-like' | 'restocking' | 'drop-zone' | 'for-you';
    title?: string;
  } | undefined;
  Search: { q?: string; openVisualSearch?: boolean } | undefined;
  AIAssistant: { mode?: 'talk' | 'chat' } | undefined;
  /** Game-lobby 3D character showcase → franchise PLP. */
  CharacterVault: { characterId?: string } | undefined;
  ProductDetail: { product: Product };
  ProductReviews: { product: Product };
  Checkout: undefined;
  OrderConfirmation: { orderId: string; awardedXp?: number };
  Orders: undefined;
  OrderDetails: { orderId: string };
  Wishlist: undefined;
  StoreLocator: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Sessions: undefined;
  VerifyEmail: undefined;
  Notifications: undefined;
  Addresses: undefined;
  Faq: undefined;
  Returns: undefined;
  Contact: undefined;
  Support: undefined;
  RaiseQuery: RaiseQueryParams;
  SupportQueryDetail: { queryId: string };
  PrivacyPolicy: undefined;
};
