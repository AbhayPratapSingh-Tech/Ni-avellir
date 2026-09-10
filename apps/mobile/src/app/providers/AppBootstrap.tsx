import { useEffect, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { appConfig } from '../../config/appConfig';
import { useAppDispatch } from '../store';
import { signIn } from '../../features/auth/authSlice';
import { hydrateSessionTokensFromSecureStore } from '../../services/api/sessionTokens';
import {
  pingApiHealth,
  startApiKeepAlive,
  stopApiKeepAlive,
} from '../../services/api/wakeApiServer';
import { authRepository } from '../../services/data/authRepository';
import { cartRepository } from '../../services/data/cartRepository';
import { colors, spacing, typography } from '../../theme/tokens';

export function AppBootstrap({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(appConfig.dataSource !== 'api');

  useEffect(() => {
    if (appConfig.dataSource !== 'api') return;
    let mounted = true;
    startApiKeepAlive();
    // Wake Render in parallel — do not block the UI on cold start (up to 90s).
    void pingApiHealth();

    (async () => {
      const hydrated = await hydrateSessionTokensFromSecureStore();
      if (hydrated) {
        const user = await authRepository.me();
        if (user && mounted) {
          dispatch(
            signIn({
              name: user.name,
              email: user.email,
              phone: user.phone,
              avatarUri: user.avatarUrl,
              runeXp: user.runeXp,
            }),
          );
        }
      }
      try {
        await cartRepository.refresh();
      } catch {
        // API may still be waking; shop can retry.
      }
      if (mounted) setReady(true);
    })();
    return () => {
      mounted = false;
      stopApiKeepAlive();
    };
  }, [dispatch]);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Text style={styles.brand}>Niðavellir</Text>
        <Text style={styles.sub}>Loading your forge…</Text>
        <ActivityIndicator color={colors.text} style={styles.spinner} />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  brand: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  splash: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  spinner: {
    marginTop: spacing.lg,
  },
  sub: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginTop: spacing.sm,
  },
});
