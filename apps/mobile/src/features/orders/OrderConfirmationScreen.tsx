import { useCallback, useEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { resetToMainTabs, resetToOrders } from '../../lib/navigation';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'OrderConfirmation'>;

const LEVELS = [
  'Apprentice',
  'Forgehand',
  'Runecarver',
  'Dwarven Lord',
  'Elder of Niðavellir',
];

export function OrderConfirmationScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const { orderId } = route.params;

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(withSpring(1, { damping: 8 }), withTiming(1));
    opacity.value = withTiming(1, { duration: 400 });
    ring.value = withSpring(1, { damping: 10, stiffness: 60 });
  }, [opacity, ring, scale]);

  useFocusEffect(
    useCallback(() => {
      const onHardwareBack = () => {
        resetToMainTabs(navigation, 'Home');
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => sub.remove();
    }, [navigation]),
  );

  const checkStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ring.value }],
    opacity: 1 - ring.value,
  }));

  const level = LEVELS[Math.floor(Math.random() * LEVELS.length)];

  return (
    <Screen edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.hero}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={[styles.check, checkStyle]}>
          <Text style={styles.checkMark}>✓</Text>
        </Animated.View>
      </View>

      <Text style={styles.title}>Order Confirmed!</Text>
      <Text style={styles.subtitle}>
        Your forge order has been placed. A confirmation has been sent to your email.
      </Text>

      <View style={styles.orderCard}>
        <View style={styles.row}>
          <Text style={styles.label}>Order ID</Text>
          <Text style={styles.value}>{orderId}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Est. delivery</Text>
          <Text style={styles.value}>3–5 business days</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment</Text>
          <Text style={styles.value}>On delivery</Text>
        </View>
      </View>

      <View style={styles.xpCard}>
        <Text style={styles.xpTitle}>⚒︎ Rune XP</Text>
        <Text style={styles.xpText}>
          You earned 120 XP for this order. New rank: <Text style={styles.xpStrong}>{level}</Text>
        </Text>
      </View>

      <Pressable style={styles.btn} onPress={() => resetToMainTabs(navigation, 'Home')}>
        <Text style={styles.btnText}>Continue shopping</Text>
      </Pressable>
      <Pressable onPress={() => resetToOrders(navigation)}>
        <Text style={styles.link}>View my orders</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    marginTop: spacing.xl,
    paddingVertical: 14,
    width: '100%',
  },
  btnText: {
    color: colors.onAccent,
    fontSize: typography.body,
    fontWeight: '800',
    textAlign: 'center',
  },
  check: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 50,
    height: 100,
    justifyContent: 'center',
    width: 100,
  },
  checkMark: {
    color: colors.onAccent,
    fontSize: 48,
    fontWeight: '800',
  },
  hero: {
    alignItems: 'center',
    height: 160,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 160,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
  },
  link: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.md,
    width: '100%',
  },
  ring: {
    borderColor: colors.accent,
    borderRadius: 70,
    borderWidth: 3,
    height: 140,
    position: 'absolute',
    width: 140,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  screen: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  value: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  xpCard: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md,
    width: '100%',
  },
  xpStrong: {
    color: colors.text,
    fontWeight: '800',
  },
  xpText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  xpTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
});
