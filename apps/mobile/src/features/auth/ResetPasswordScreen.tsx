import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useToast } from '../../components/ui/Toast';
import { authRepository } from '../../services/data/authRepository';
import type { AuthStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<AuthStackParamList>;

export function ResetPasswordScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<RouteProp<AuthStackParamList, 'ResetPassword'>>();
  const toast = useToast();
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || code.length < 4 || password.length < 6) {
      toast.show('Enter email, 4-digit code, and new password (6+)');
      return;
    }
    setLoading(true);
    try {
      await authRepository.resetPassword(email.trim(), code, password);
      toast.show('Password updated — log in');
      navigation.navigate('Login');
    } catch (error) {
      toast.show(authRepository.getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <Text style={styles.title}>Reset password</Text>
      <Text style={styles.sub}>Enter the code from your email and choose a new password.</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="4-digit code"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={4}
        value={code}
        onChangeText={setCode}
      />
      <TextInput
        style={styles.input}
        placeholder="New password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.cta} onPress={submit} disabled={loading}>
        <Text style={styles.ctaText}>{loading ? 'Saving…' : 'Update password'}</Text>
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
