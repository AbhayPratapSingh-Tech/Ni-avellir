import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { updateProfile } from '../auth/authSlice';
import { useToast } from '../../components/ui/Toast';
import { apiClient, getApiErrorMessage } from '../../services/api/apiClient';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type Step = 'send' | 'code';

export function VerifyEmailScreen() {
  const navigation = useNavigation<Navigation>();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const user = useAppSelector((state) => state.auth.user);
  const alreadyVerified = Boolean(user?.emailVerified);
  const [step, setStep] = useState<Step>('send');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/verify-email/send');
      if (data.data?.alreadyVerified) {
        dispatch(updateProfile({ emailVerified: true }));
        toast.show('Email is already verified');
        navigation.goBack();
        return;
      }
      if (data.data?.demoCode) {
        toast.show(`Dev code (email demo mode): ${data.data.demoCode}`);
      } else {
        toast.show('Email sent — check inbox and spam');
      }
      setStep('code');
    } catch (error) {
      toast.show(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!user?.email || code.length < 4) {
      toast.show('Enter the 4-digit code from your email');
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/verify-email', {
        email: user.email,
        code,
      });
      const next = data.data.user;
      dispatch(
        updateProfile({
          name: next.name,
          email: next.email,
          phone: next.phone,
          avatarUri: next.avatarUrl ?? null,
          runeXp: next.runeXp,
          emailVerified: next.emailVerified ?? true,
        }),
      );
      toast.show('Email verified');
      navigation.goBack();
    } catch (error) {
      toast.show(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (alreadyVerified) {
    return (
      <Screen edges={[]} style={styles.screen}>
        <Text style={styles.sub}>
          {user?.email || 'Your email'} is already verified. You’re all set for order updates.
        </Text>
        <Pressable style={styles.cta} onPress={() => navigation.goBack()}>
          <Text style={styles.ctaText}>Done</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen edges={[]} style={styles.screen}>
      {step === 'send' ? (
        <>
          <Text style={styles.sub}>
            We’ll email a 4-digit code to {user?.email || 'your address'}. Check inbox and spam.
          </Text>
          <Text style={styles.hint}>
            With Resend’s free onboarding sender, mail may only arrive if this address matches your
            Resend account email.
          </Text>
          <Pressable style={styles.cta} onPress={sendCode} disabled={loading}>
            <Text style={styles.ctaText}>{loading ? 'Sending…' : 'Send verification email'}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.sub}>
            Enter the code we sent to {user?.email || 'your email'}, or open the link in the email.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="4-digit code"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={4}
            value={code}
            onChangeText={setCode}
            autoFocus
          />
          <Pressable style={styles.cta} onPress={submit} disabled={loading}>
            <Text style={styles.ctaText}>{loading ? 'Verifying…' : 'Verify email'}</Text>
          </Pressable>
          <Pressable onPress={sendCode} style={styles.linkWrap} disabled={loading}>
            <Text style={styles.link}>{loading ? 'Sending…' : 'Resend email'}</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cta: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 12,
    marginTop: spacing.md,
    paddingVertical: 14,
  },
  ctaText: { color: colors.onAccent, fontSize: 16, fontWeight: '800' },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
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
  link: { color: colors.text, fontWeight: '800', textAlign: 'center' },
  linkWrap: { marginTop: spacing.lg },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sub: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginBottom: spacing.md },
});
