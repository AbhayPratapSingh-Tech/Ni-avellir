import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useToast } from '../../components/ui/Toast';
import { appConfig } from '../../config/appConfig';
import { authRepository } from '../../services/data/authRepository';
import type { AuthStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<AuthStackParamList>;
type Route = RouteProp<AuthStackParamList, 'Otp'>;

export function OtpScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const toast = useToast();
  const { name, email, phone, password, purpose = 'login', devVerifyCode } = route.params;
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [devCode, setDevCode] = useState<string | undefined>(devVerifyCode);
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (appConfig.dataSource !== 'api' || purpose !== 'login' || !phone) return;
    authRepository.sendOtp(phone, 'login').then((result) => {
      if (result.demoCode) setDevCode(result.demoCode);
    }).catch(() => {
      // Login flow may have already sent OTP
    });
  }, [phone, purpose]);

  useEffect(() => {
    if (appConfig.dataSource !== 'api' || purpose !== 'verify_email' || !email.trim() || devVerifyCode) {
      return;
    }
    let cancelled = false;
    authRepository.resendVerifyEmail(email.trim()).then((result) => {
      if (!cancelled && result.demoCode) setDevCode(result.demoCode);
    }).catch(() => {
      // User can tap Resend manually
    });
    return () => {
      cancelled = true;
    };
  }, [devVerifyCode, email, purpose]);

  const resend = async () => {
    if (appConfig.dataSource !== 'api') return;
    setResending(true);
    try {
      if (purpose === 'verify_email') {
        const result = await authRepository.resendVerifyEmail(email.trim());
        if (result.demoCode) {
          setDevCode(result.demoCode);
          toast.show('New dev code generated (see below)');
        } else toast.show('Verification email sent again');
      } else if (phone) {
        const result = await authRepository.sendOtp(phone, 'login');
        if (result.demoCode) {
          setDevCode(result.demoCode);
          toast.show('New dev OTP generated (see below)');
        } else toast.show('OTP sent again');
      }
    } catch (error) {
      toast.show(authRepository.getApiErrorMessage(error));
    } finally {
      setResending(false);
    }
  };

  const submit = async () => {
    if (otp.join('').length < 4) {
      toast.show('Enter the 4-digit code');
      return;
    }
    const code = otp.join('');

    if (appConfig.dataSource === 'api' && purpose === 'verify_email') {
      if (!password?.trim()) {
        toast.show('Missing signup session — go back and try again');
        return;
      }
      setLoading(true);
      try {
        const user = await authRepository.verifyEmailAndLogin(email.trim(), code, password);
        navigation.replace('AuthSuccess', {
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

    if (appConfig.dataSource === 'api' && phone) {
      setLoading(true);
      try {
        const user = await authRepository.verifyOtp({
          phone,
          code,
          name,
          email,
        });
        navigation.replace('AuthSuccess', {
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

    navigation.replace('AuthSuccess', { name, email, phone });
  };

  const destination =
    purpose === 'verify_email' ? email : phone || email;

  return (
    <Screen edges={[]} style={styles.screen}>
      <Text style={styles.sub}>
        {purpose === 'verify_email'
          ? devCode
            ? `Enter the code below to verify ${email} and finish signup.`
            : `We sent a verification code to ${email}. Enter it below to finish creating your account.`
          : devCode
            ? `Enter the code below to continue.`
            : `We sent a code to ${destination}.`}
        {appConfig.dataSource === 'api' ? '' : ' Use any 4 digits for this demo.'}
      </Text>
      {devCode ? (
        <View style={styles.devBanner}>
          <Text style={styles.devLabel}>Development code</Text>
          <Text style={styles.devCode}>{devCode}</Text>
          <Text style={styles.devNotice}>
            This app is under development — real emails are not sent yet. Use the locally
            generated OTP shown above to verify your account.
          </Text>
          <Text style={styles.devHint}>Tap Resend below if the code expires (10 min).</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(node) => {
              inputs.current[index] = node;
            }}
            style={styles.box}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(value) => {
              const next = [...otp];
              next[index] = value.replace(/\D/g, '').slice(-1);
              setOtp(next);
              if (next[index] && index < 3) {
                inputs.current[index + 1]?.focus();
              }
            }}
          />
        ))}
      </View>
      <Pressable style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]} onPress={submit}>
        {({ pressed }) => (
          <Text style={[styles.ctaText, pressed && styles.ctaTextPressed]}>
            {loading ? 'Verifying…' : purpose === 'verify_email' ? 'Verify & create account' : 'Verify & continue'}
          </Text>
        )}
      </Pressable>
      {appConfig.dataSource === 'api' ? (
        <Pressable onPress={resend} disabled={resending || loading} style={styles.resendWrap}>
          <Text style={styles.resend}>
            {resending ? 'Sending…' : "Didn't get the code? Resend"}
          </Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    height: 56,
    textAlign: 'center',
    width: 56,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 12,
    marginTop: spacing.xl,
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
  devBanner: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  devCode: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 8,
    marginTop: 4,
    textAlign: 'center',
  },
  devHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  devNotice: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  devLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  resend: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  resendWrap: {
    marginTop: spacing.lg,
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
  },
});
