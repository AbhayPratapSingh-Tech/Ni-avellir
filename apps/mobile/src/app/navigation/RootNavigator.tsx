import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { colors } from '../../theme/tokens';
import { HomeScreen } from '../../features/home/HomeScreen';
import { CategoriesScreen } from '../../features/categories/CategoriesScreen';
import { ProductsScreen } from '../../features/products/ProductsScreen';
import { SearchScreen } from '../../features/search/SearchScreen';
import { ProductDetailScreen } from '../../features/products/ProductDetailScreen';
import { CartScreen } from '../../features/cart/CartScreen';
import { ProfileScreen } from '../../features/profile/ProfileScreen';
import { CheckoutScreen } from '../../features/checkout/CheckoutScreen';
import { OrderConfirmationScreen } from '../../features/orders/OrderConfirmationScreen';
import { OrdersScreen } from '../../features/orders/OrdersScreen';
import { OrderDetailsScreen } from '../../features/orders/OrderDetailsScreen';
import { EditProfileScreen } from '../../features/profile/EditProfileScreen';
import { AddressesScreen } from '../../features/addresses/AddressesScreen';
import { FaqScreen } from '../../features/info/FaqScreen';
import { ReturnsScreen } from '../../features/info/ReturnsScreen';
import { ContactScreen } from '../../features/info/ContactScreen';
import { SupportScreen } from '../../features/info/SupportScreen';
import { WishlistScreen } from '../../features/wishlist/WishlistScreen';
import { OnboardingScreen } from '../../features/auth/OnboardingScreen';
import { LoginScreen } from '../../features/auth/LoginScreen';
import { SignupScreen } from '../../features/auth/SignupScreen';
import { OtpScreen } from '../../features/auth/OtpScreen';
import { AuthSuccessScreen } from '../../features/auth/AuthSuccessScreen';
import { ForgotPasswordScreen } from '../../features/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../../features/auth/ResetPasswordScreen';
import { ChangePasswordScreen } from '../../features/profile/ChangePasswordScreen';
import { SessionsScreen } from '../../features/profile/SessionsScreen';
import { VerifyEmailScreen } from '../../features/profile/VerifyEmailScreen';
import { NotificationsScreen } from '../../features/profile/NotificationsScreen';
import { useAppSelector } from '../store';
import type { AuthStackParamList, MainTabParamList, RootStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    border: colors.border,
    card: colors.surface,
    primary: colors.text,
    text: colors.text,
  },
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ color: focused ? colors.text : colors.textMuted, fontSize: 18 }}>{label}</Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
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
        options={{
          tabBarLabel: 'Forge',
          tabBarIcon: ({ focused }) => <TabIcon label="⚒" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          tabBarLabel: 'Categories',
          tabBarIcon: ({ focused }) => <TabIcon label="◉" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: ({ focused }) => <TabIcon label="🛒" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Account"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ focused }) => <TabIcon label="⚙" focused={focused} />,
        }}
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

function AuthNavigator({ initialRouteName }: { initialRouteName: keyof AuthStackParamList }) {
  return (
    <AuthStack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800' as const },
        contentStyle: { backgroundColor: colors.background },
        headerShown: false,
      }}
    >
      <AuthStack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{
          contentStyle: { backgroundColor: '#07080C' },
        }}
      />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ headerShown: true, title: 'Sign up' }}
      />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: true, title: 'Forgot password' }}
      />
      <AuthStack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ headerShown: true, title: 'Reset password' }}
      />
      <AuthStack.Screen
        name="Otp"
        component={OtpScreen}
        options={{ headerShown: true, title: 'Verify code' }}
      />
      <AuthStack.Screen
        name="AuthSuccess"
        component={AuthSuccessScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </AuthStack.Navigator>
  );
}

function ShopNavigator() {
  return (
    <RootStack.Navigator screenOptions={rootScreenOptions}>
      <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <RootStack.Screen
        name="Products"
        component={ProductsScreen}
        options={({ route }) => ({ title: route.params?.title ?? 'Products' })}
      />
      <RootStack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
      <RootStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
      <RootStack.Screen
        name="OrderConfirmation"
        component={OrderConfirmationScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <RootStack.Screen name="Orders" component={OrdersScreen} options={{ title: 'My Orders' }} />
      <RootStack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{ title: 'Order details' }}
      />
      <RootStack.Screen name="Wishlist" component={WishlistScreen} options={{ title: 'Wishlist' }} />
      <RootStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit profile' }}
      />
      <RootStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change password' }}
      />
      <RootStack.Screen name="Sessions" component={SessionsScreen} options={{ title: 'Sessions' }} />
      <RootStack.Screen
        name="VerifyEmail"
        component={VerifyEmailScreen}
        options={{ title: 'Verify email' }}
      />
      <RootStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <RootStack.Screen
        name="Addresses"
        component={AddressesScreen}
        options={{ title: 'Addresses' }}
      />
      <RootStack.Screen name="Faq" component={FaqScreen} options={{ title: 'FAQs' }} />
      <RootStack.Screen
        name="Returns"
        component={ReturnsScreen}
        options={{ title: 'Return & exchange' }}
      />
      <RootStack.Screen name="Contact" component={ContactScreen} options={{ title: 'Support' }} />
      <RootStack.Screen name="Support" component={SupportScreen} options={{ title: 'Support' }} />
    </RootStack.Navigator>
  );
}

export function RootNavigator() {
  const user = useAppSelector((state) => state.auth.user);
  const startOnLogin = useAppSelector((state) => state.auth.startOnLogin);

  return (
    <NavigationContainer theme={theme}>
      {user ? (
        <ShopNavigator />
      ) : (
        <AuthNavigator initialRouteName={startOnLogin ? 'Login' : 'Onboarding'} />
      )}
    </NavigationContainer>
  );
}
