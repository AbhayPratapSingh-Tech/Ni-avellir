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

/** Never leave the splash hung on cold API / Keychain stalls. */
const BOOTSTRAP_BUDGET_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(undefined), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(undefined);
      });
  });
}

export function AppBootstrap({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(appConfig.dataSource !== 'api');

  useEffect(() => {
    if (appConfig.dataSource !== 'api') return;
    let mounted = true;
    startApiKeepAlive();
    // Wake Render in parallel — do not block the UI on cold start.
    void pingApiHealth();

    (async () => {
      try {
        const hydrated = await withTimeout(hydrateSessionTokensFromSecureStore(), 3_000);
        if (hydrated) {
          const user = await withTimeout(authRepository.me(), 5_000);
          if (user && mounted) {
            dispatch(
              signIn({
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatarUri: user.avatarUrl,
                runeXp: user.runeXp,
                emailVerified: user.emailVerified,
              }),
            );
          }
        }
        await withTimeout(cartRepository.refresh(), 5_000);
      } catch {
        // Shop can retry after splash.
      } finally {
        if (mounted) setReady(true);
      }
    })();

    const forceReady = setTimeout(() => {
      if (mounted) setReady(true);
    }, BOOTSTRAP_BUDGET_MS);

    return () => {
      mounted = false;
      clearTimeout(forceReady);
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
