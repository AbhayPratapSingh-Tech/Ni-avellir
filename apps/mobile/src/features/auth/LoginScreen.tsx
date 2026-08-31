import { useCallback, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { enterGuest } from './authSlice';
import { useToast } from '../../components/ui/Toast';
import { appConfig } from '../../config/appConfig';
import { authRepository } from '../../services/data/authRepository';
import type { AuthStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<AuthStackParamList>;
type Mode = 'phone' | 'email';

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export function LoginScreen() {
  const navigation = useNavigation<Navigation>();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const startOnLogin = useAppSelector((state) => state.auth.startOnLogin);
  const [mode, setMode] = useState<Mode>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  /** Profile → Login clears guest; Back must restore shop instead of leaving the app. */
  const returnToShopAsGuest = useCallback(() => {
    dispatch(enterGuest());
  }, [dispatch]);

  const handleBack = useCallback(() => {
    // Profile → Login always restores guest shop; don't get stuck under Signup/OTP quirks.
    if (startOnLogin) {
      returnToShopAsGuest();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation, returnToShopAsGuest, startOnLogin]);

  useFocusEffect(
    useCallback(() => {
      if (!startOnLogin) {
        return undefined;
      }
      const onHardwareBack = () => {
        returnToShopAsGuest();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => sub.remove();
    }, [returnToShopAsGuest, startOnLogin]),
  );

  const submitPhone = async () => {
    const mobile = digitsOnly(phone);
    if (mobile.length < 10) {
      toast.show('Enter a valid mobile number');
      return;
    }
    if (appConfig.dataSource === 'api') {
      setLoading(true);
      try {
        const result = await authRepository.sendOtp(mobile, 'login');
        if (result.demoCode) {
          toast.show(`Dev OTP: ${result.demoCode}`);
        }
        navigation.navigate('Otp', { name: `User ${mobile.slice(-4)}`, email: '', phone: mobile });
      } catch (error) {
        toast.show(authRepository.getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
      return;
    }
    navigation.navigate('Otp', {
      name: `User ${mobile.slice(-4)}`,
      email: '',
      phone: mobile,
    });
  };

  const submitEmail = async () => {
    if (!email.trim() || !password.trim()) {
      toast.show('Enter email and password');
      return;
    }
    if (appConfig.dataSource === 'api') {
      setLoading(true);
      try {
        const user = await authRepository.login(email.trim(), password);
        navigation.navigate('AuthSuccess', {
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatarUri: user.avatarUrl,
        });
      } catch (error) {
        toast.show(authRepository.getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
      return;
    }
    navigation.navigate('AuthSuccess', {
      name: email.split('@')[0] || 'Forgehand',
      email: email.trim(),
      phone: '',
    });
  };

  const showBack = navigation.canGoBack() || startOnLogin;

  return (
    <Screen style={styles.screen}>
      {showBack ? (
        <Pressable onPress={handleBack} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
      ) : null}
      <Text style={styles.kicker}>Niðavellir</Text>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.sub}>
        {mode === 'phone'
          ? 'Enter your mobile number. We’ll send a 4-digit OTP.'
          : 'Welcome back. Enter your email and password.'}
      </Text>

      {mode === 'phone' ? (
        <View style={styles.phoneRow}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>+91</Text>
          </View>
          <TextInput
            style={[styles.input, styles.phoneInput]}
            placeholder="Mobile number"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={(value) => setPhone(digitsOnly(value).slice(0, 10))}
          />
        </View>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </>
      )}

      <View style={styles.altRow}>
        <Pressable
          onPress={() => setMode(mode === 'phone' ? 'email' : 'phone')}
          hitSlop={8}
        >
          <Text style={styles.altLink}>
            {mode === 'phone' ? 'Login with email' : 'Login with mobile'}
          </Text>
        </Pressable>
        {mode === 'email' ? (
          <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
            <Text style={styles.altLink}>Forgot password?</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={mode === 'phone' ? submitPhone : submitEmail}
      >
        {({ pressed }) => (
          <Text style={[styles.ctaText, pressed && styles.ctaTextPressed]}>
            {loading ? 'Please wait…' : mode === 'phone' ? 'Send OTP' : 'Login'}
          </Text>
        )}
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Signup')} style={styles.linkWrap}>
        <Text style={styles.link}>
          Don’t have an account? <Text style={styles.linkStrong}>Sign up</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  altLink: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  back: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 12,
    marginTop: spacing.lg,
    paddingVertical: 14,
  },
  ctaPressed: {
    backgroundColor: colors.accent,
  },
  ctaText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '800',
  },
  ctaTextPressed: {
    color: colors.onAccent,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  kicker: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  link: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  linkStrong: {
    color: colors.text,
    fontWeight: '800',
  },
  linkWrap: {
    marginTop: spacing.lg,
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
  },
  phoneRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  prefix: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: spacing.sm,
    paddingHorizontal: 14,
  },
  prefixText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  sub: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
    marginTop: 8,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    marginTop: 8,
  },
});
