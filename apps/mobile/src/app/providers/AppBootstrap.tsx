import { useEffect, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, View } from 'react-native';
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
import { colors } from '../../theme/tokens';

export function AppBootstrap({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(appConfig.dataSource !== 'api');

  useEffect(() => {
    if (appConfig.dataSource !== 'api') return;
    let mounted = true;
    startApiKeepAlive();
    (async () => {
      // Wake Render Free before auth/cart so the first real calls hit a warm server.
      await pingApiHealth();
      if (!mounted) return;

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
            }),
          );
        }
      }
      try {
        await cartRepository.refresh();
      } catch {
        // API may be offline; allow mock fallback paths
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return children;
}
