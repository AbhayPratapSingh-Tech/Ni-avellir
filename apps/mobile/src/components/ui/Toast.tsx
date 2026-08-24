import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../theme/tokens';

type ToastContextValue = {
  show: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue>({ show: () => undefined });

export function useToast() {
  return useContext(ToastContext);
}

const BOLT_LEFT = 'M18 1 L10 23 H17.5 L11 51 L29 20.5 H20.5 L25 1 Z';
const BOLT_RIGHT = 'M20 0 L13 20 H20 L14 44 L31 17 H22.5 L27 0 Z';

function LightningBolt({
  d,
  delay,
  playKey,
  offsetX,
}: {
  d: string;
  delay: number;
  playKey: number;
  offsetX: number;
}) {
  const opacity = useSharedValue(0);
  const scaleY = useSharedValue(0.2);

  useEffect(() => {
    opacity.value = 0;
    scaleY.value = 0.2;
    const timeout = setTimeout(() => {
      opacity.value = withSequence(
        withTiming(1, { duration: 60 }),
        withTiming(0.2, { duration: 80 }),
        withTiming(1, { duration: 50 }),
        withTiming(0.35, { duration: 90 }),
        withTiming(0.95, { duration: 70 }),
        withTiming(0, { duration: 240, easing: Easing.out(Easing.quad) }),
      );
      scaleY.value = withSequence(
        withTiming(1.2, { duration: 80 }),
        withTiming(0.92, { duration: 90 }),
        withTiming(1.08, { duration: 70 }),
        withTiming(1, { duration: 180 }),
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, [playKey, delay, opacity, scaleY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: offsetX }, { scaleY: scaleY.value }],
  }));

  return (
    <Animated.View style={[styles.boltWrap, style]} pointerEvents="none">
      <Svg width={34} height={54} viewBox="0 0 36 52">
        <Path d={d} fill="#7DD3FC" opacity={0.55} />
        <Path d={d} fill="#F0F9FF" />
      </Svg>
    </Animated.View>
  );
}

function ToastBanner({ message, playKey }: { message: string; playKey: number }) {
  const translateY = useSharedValue(-16);

  useEffect(() => {
    translateY.value = -16;
    translateY.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [playKey, translateY]);

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.bannerRoot} pointerEvents="none">
      <View style={styles.boltsRow}>
        <LightningBolt playKey={playKey} delay={30} offsetX={-10} d={BOLT_LEFT} />
        <LightningBolt playKey={playKey} delay={90} offsetX={12} d={BOLT_RIGHT} />
      </View>
      <Animated.View style={[styles.toast, bannerStyle]}>
        <Text style={styles.boltMark}>⚡</Text>
        <Text style={styles.text} numberOfLines={2}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
}

export function ToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const [token, setToken] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((next: string) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    setMessage(next);
    setToken((value) => value + 1);
    timer.current = setTimeout(() => setMessage(null), 2400);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        {message ? (
          <View pointerEvents="none" style={[styles.overlay, { paddingTop: insets.top + 8 }]}>
            <ToastBanner key={token} message={message} playKey={token} />
          </View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  bannerRoot: {
    alignItems: 'center',
  },
  boltMark: {
    fontSize: 14,
    marginRight: 8,
  },
  boltWrap: {
    height: 54,
    width: 34,
  },
  boltsRow: {
    flexDirection: 'row',
    height: 54,
    justifyContent: 'center',
    marginBottom: -10,
    zIndex: 2,
  },
  overlay: {
    elevation: 100,
    left: 0,
    paddingHorizontal: spacing.md,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 9999,
  },
  root: {
    flex: 1,
  },
  text: {
    color: '#F8FAFC',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  toast: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(17, 19, 24, 0.94)',
    borderColor: 'rgba(125, 211, 252, 0.45)',
    borderRadius: 999,
    borderWidth: 1,
    elevation: 12,
    flexDirection: 'row',
    maxWidth: '92%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    zIndex: 3,
  },
});
