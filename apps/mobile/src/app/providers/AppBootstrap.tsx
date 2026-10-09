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
import { authRepository, syncLoggedInStores } from '../../services/data/authRepository';
import { cartRepository } from '../../services/data/cartRepository';
import { BrandMark } from '../../components/ui/BrandMark';
import { colors, spacing } from '../../theme/tokens';

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
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatarUri: user.avatarUrl,
                runeXp: user.runeXp,
                emailVerified: user.emailVerified,
              }),
            );
            // Orders / addresses / wishlist must hydrate with the session (not only on login).
            await withTimeout(syncLoggedInStores(), 5_000);
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
        <BrandMark height={108} />
        <Text style={styles.sub}>Loading your forge…</Text>
        <ActivityIndicator color={colors.text} style={styles.spinner} />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
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
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: spacing.md,
  },
});
