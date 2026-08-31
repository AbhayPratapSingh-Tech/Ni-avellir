import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useToast } from '../../components/ui/Toast';
import { authRepository } from '../../services/data/authRepository';
import type { AuthStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<AuthStackParamList>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Navigation>();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim()) {
      toast.show('Enter your email');
      return;
    }
    setLoading(true);
    try {
      const result = await authRepository.forgotPassword(email.trim());
      if (result?.demoCode) toast.show(`Dev reset code: ${result.demoCode}`);
      else toast.show('If that email exists, a reset code was sent');
      navigation.navigate('ResetPassword', { email: email.trim() });
    } catch (error) {
      toast.show(authRepository.getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <Text style={styles.title}>Forgot password</Text>
      <Text style={styles.sub}>We’ll email a 4-digit code to reset your password.</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Pressable style={styles.cta} onPress={submit} disabled={loading}>
        <Text style={styles.ctaText}>{loading ? 'Sending…' : 'Send reset code'}</Text>
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
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  sub: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginBottom: spacing.lg },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '800', marginBottom: 8 },
});
