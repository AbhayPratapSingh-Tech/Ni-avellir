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

export function VerifyEmailScreen() {
  const navigation = useNavigation<Navigation>();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const user = useAppSelector((state) => state.auth.user);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const resend = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/verify-email/send');
      if (data.data?.demoCode) toast.show(`Dev verify code: ${data.data.demoCode}`);
      else toast.show('Verification email sent');
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

  return (
    <Screen edges={[]} style={styles.screen}>
      <Text style={styles.sub}>
        We sent a code to {user?.email || 'your email'}. Enter it below, or open the link in the
        email.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="4-digit code"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={4}
        value={code}
        onChangeText={setCode}
      />
      <Pressable style={styles.cta} onPress={submit} disabled={loading}>
        <Text style={styles.ctaText}>{loading ? 'Verifying…' : 'Verify email'}</Text>
      </Pressable>
      <Pressable onPress={resend} style={styles.linkWrap}>
        <Text style={styles.link}>Resend email</Text>
      </Pressable>
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
  sub: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginBottom: spacing.lg },
});
