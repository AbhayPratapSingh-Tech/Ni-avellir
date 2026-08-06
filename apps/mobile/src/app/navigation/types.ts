import type { Product } from '@nidavellir/shared';

export type RootStackParamList = {
  MainTabs: undefined;
  Products: undefined;
  ProductDetail: { product: Product };
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
  Orders: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  ProductsTab: undefined;
  Cart: undefined;
  Wishlist: undefined;
  Profile: undefined;
};
