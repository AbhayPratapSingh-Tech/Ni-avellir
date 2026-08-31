import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useToast } from '../../components/ui/Toast';
import { authRepository } from '../../services/data/authRepository';
import { apiClient, getApiErrorMessage } from '../../services/api/apiClient';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function ChangePasswordScreen() {
  const navigation = useNavigation<Navigation>();
  const toast = useToast();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!currentPassword || newPassword.length < 6) {
      toast.show('Enter current password and new password (6+)');
      return;
    }
    if (newPassword !== confirm) {
      toast.show('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword });
      toast.show('Password changed');
      navigation.goBack();
    } catch (error) {
      toast.show(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={[]} style={styles.screen}>
      <Text style={styles.sub}>Choose a strong password you haven’t used before.</Text>
      <TextInput
        style={styles.input}
        placeholder="Current password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrent}
      />
      <TextInput
        style={styles.input}
        placeholder="New password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={newPassword}
        onChangeText={setNew}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm new password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
      />
      <Pressable style={styles.cta} onPress={submit} disabled={loading}>
        <Text style={styles.ctaText}>{loading ? 'Saving…' : 'Change password'}</Text>
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
    paddingTop: spacing.md,
  },
  sub: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginBottom: spacing.lg },
});
