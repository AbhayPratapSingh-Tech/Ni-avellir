import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useToast } from '../../components/ui/Toast';
import type { AuthStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<AuthStackParamList>;

export function SignupScreen() {
  const navigation = useNavigation<Navigation>();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const submit = () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      toast.show('Fill all fields');
      return;
    }
    if (password !== confirm) {
      toast.show('Passwords do not match');
      return;
    }
    navigation.navigate('Otp', {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
  };

  return (
    <Screen edges={[]} style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={styles.sub}>Create an account to start the forge.</Text>

        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />
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
          placeholder="Phone number"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />

        <Pressable style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]} onPress={submit}>
          {({ pressed }) => (
            <Text style={[styles.ctaText, pressed && styles.ctaTextPressed]}>Create account</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
          <Text style={styles.link}>
            Already have an account? <Text style={styles.linkStrong}>Login</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 12,
    marginTop: spacing.sm,
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
  link: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  linkStrong: {
    color: colors.accent,
    fontWeight: '800',
  },
  linkWrap: {
    marginTop: spacing.lg,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sub: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
});
