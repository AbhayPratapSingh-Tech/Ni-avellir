import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { colors } from '../../theme/tokens';
import { HomeScreen } from '../../features/home/HomeScreen';
import { ProductsScreen } from '../../features/products/ProductsScreen';
import { ProductDetailScreen } from '../../features/products/ProductDetailScreen';
import { CartScreen } from '../../features/cart/CartScreen';
import { WishlistScreen } from '../../features/wishlist/WishlistScreen';
import { ProfileScreen } from '../../features/profile/ProfileScreen';
import { CheckoutScreen } from '../../features/checkout/CheckoutScreen';
import { OrderConfirmationScreen } from '../../features/orders/OrderConfirmationScreen';
import { OrdersScreen } from '../../features/orders/OrdersScreen';
import type { MainTabParamList, RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    border: colors.border,
    card: colors.surface,
    primary: colors.accent,
    text: colors.text,
  },
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        color: focused ? colors.accent : colors.textMuted,
        fontSize: 18,
      }}
    >
      {label}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="⌂" focused={focused} /> }}
      />
      <Tab.Screen
        name="ProductsTab"
        component={ProductsScreen}
        options={{
          tabBarLabel: 'Products',
          tabBarIcon: ({ focused }) => <TabIcon label="◆" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="🛒" focused={focused} /> }}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="♥" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="⚙" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

const rootScreenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '800' as const },
  contentStyle: { backgroundColor: colors.background },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <RootStack.Navigator screenOptions={rootScreenOptions}>
        <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <RootStack.Screen name="Products" component={ProductsScreen} options={{ title: 'Products' }} />
        <RootStack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ title: 'Product' }}
        />
        <RootStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
        <RootStack.Screen
          name="OrderConfirmation"
          component={OrderConfirmationScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen name="Orders" component={OrdersScreen} options={{ title: 'My Orders' }} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
