import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Product } from '@nidavellir/shared';

export type MainTabParamList = {
  Home: undefined;
  Categories: undefined;
  Cart: undefined;
  Account: undefined;
};

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  Otp: { name: string; email: string; phone: string };
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Products: {
    category?: string;
    q?: string;
    franchise?: string;
    collection?: 'bestsellers' | 'deals' | 'also-like';
    title?: string;
  } | undefined;
  Search: { q?: string } | undefined;
  ProductDetail: { product: Product };
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
  Orders: undefined;
  EditProfile: undefined;
};
