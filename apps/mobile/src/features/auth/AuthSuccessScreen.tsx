import { useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useAppDispatch } from '../../app/store';
import { signIn } from './authSlice';
import type { AuthStackParamList } from '../../app/navigation/types';

type Route = RouteProp<AuthStackParamList, 'AuthSuccess'>;

const SUCCESS = '#16A34A';
const SUCCESS_SOFT = 'rgba(22, 163, 74, 0.18)';
const SUCCESS_GLOW = 'rgba(34, 197, 94, 0.45)';

function PulseRing({ delayMs, size }: { delayMs: number; size: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }),
        ),
        -1,
        false,
      ),
    );
  }, [delayMs, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: (1 - progress.value) * 0.55,
    transform: [{ scale: 0.72 + progress.value * 0.85 }],
  }));

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    />
  );
}

export function AuthSuccessScreen() {
  const route = useRoute<Route>();
  const dispatch = useAppDispatch();
  const { name, email, phone, avatarUri } = route.params;

  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const glow = useSharedValue(0.4);

  useEffect(() => {
    checkScale.value = withSpring(1, { damping: 9, stiffness: 120 });
    checkOpacity.value = withTiming(1, { duration: 350 });
    glow.value = withRepeat(
      withSequence(withTiming(1, { duration: 900 }), withTiming(0.35, { duration: 900 })),
      -1,
      true,
    );
  }, [checkOpacity, checkScale, glow]);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(signIn({ name, email, phone, avatarUri }));
    }, 2600);
    return () => clearTimeout(timer);
  }, [avatarUri, dispatch, email, name, phone]);

  useFocusEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  });

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.9 + glow.value * 0.15 }],
  }));

  return (
    <Screen edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.hero}>
        <PulseRing delayMs={0} size={200} />
        <PulseRing delayMs={450} size={200} />
        <PulseRing delayMs={900} size={200} />
        <Animated.View style={[styles.glow, glowStyle]} />
        <Animated.View style={[styles.check, checkStyle]}>
          <Text style={styles.checkMark}>✓</Text>
        </Animated.View>
      </View>

      <Text style={styles.title}>You&apos;re logged in successfully</Text>
      <Text style={styles.subtitle}>Welcome to the forge, {name.split(' ')[0] || 'Forgehand'}.</Text>
      <Text style={styles.hint}>Opening your shop…</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  check: {
    alignItems: 'center',
    backgroundColor: SUCCESS,
    borderColor: '#BBF7D0',
    borderRadius: 56,
    borderWidth: 4,
    height: 112,
    justifyContent: 'center',
    width: 112,
    zIndex: 2,
  },
  checkMark: {
    color: colors.onAccent,
    fontSize: 52,
    fontWeight: '800',
    marginTop: -2,
  },
  glow: {
    backgroundColor: SUCCESS_SOFT,
    borderRadius: 80,
    height: 160,
    position: 'absolute',
    width: 160,
    zIndex: 0,
  },
  hero: {
    alignItems: 'center',
    height: 220,
    justifyContent: 'center',
    marginBottom: spacing.xl,
    width: 220,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.lg,
  },
  pulseRing: {
    borderColor: SUCCESS_GLOW,
    borderWidth: 2,
    position: 'absolute',
    zIndex: 1,
  },
  screen: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    textAlign: 'center',
  },
});
