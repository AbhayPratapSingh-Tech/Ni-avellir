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
    collection?: 'bestsellers' | 'deals' | 'also-like' | 'restocking';
    title?: string;
  } | undefined;
  Search: { q?: string } | undefined;
  ProductDetail: { product: Product };
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
  Orders: undefined;
  OrderDetails: { orderId: string };
  Wishlist: undefined;
  EditProfile: undefined;
  Addresses: undefined;
  Faq: undefined;
  Returns: undefined;
  Contact: undefined;
  Support: undefined;
};
