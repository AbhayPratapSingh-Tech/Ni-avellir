import { CommonActions } from '@react-navigation/native';
import type { MainTabParamList } from '../app/navigation/types';

/** Clear stack above MainTabs (e.g. after a successful order). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resetToMainTabs(navigation: { dispatch: (action: any) => void }, screen: keyof MainTabParamList = 'Home') {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'MainTabs',
          state: {
            index: 0,
            routes: [{ name: screen }],
          },
        },
      ],
    }),
  );
}

/** Reset shop stack then open Orders (no leftover Checkout/PDP under confirmation). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resetToOrders(navigation: { dispatch: (action: any) => void }) {
  navigation.dispatch(
    CommonActions.reset({
      index: 1,
      routes: [
        {
          name: 'MainTabs',
          state: {
            index: 0,
            routes: [{ name: 'Home' }],
          },
        },
        { name: 'Orders' },
      ],
    }),
  );
}

/** Safe soft-back for stack screens (Search, PDP, etc.). */
export function goBackOrHome(navigation: {
  canGoBack: () => boolean;
  goBack: () => void;
  navigate: (name: 'MainTabs', params: { screen: keyof MainTabParamList }) => void;
}) {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }
  navigation.navigate('MainTabs', { screen: 'Home' });
}
