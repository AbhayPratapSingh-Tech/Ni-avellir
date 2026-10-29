import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useToast } from '../../components/ui/Toast';
import { useAppSelector } from '../../app/store';
import { digitsOnly } from '../../lib/addressValidation';
import { submitContactMessage } from '../../services/support/submitContactMessage';
import type { AuthStackParamList, RootStackParamList } from '../../app/navigation/types';
import { COMPANY } from './companyInfo';
import {
  emptyContactFromUser,
  validateContactForm,
  type ContactFormState,
} from './formValidation';

type Navigation = NativeStackNavigationProp<RootStackParamList & AuthStackParamList>;

export function ContactScreen() {
  const navigation = useNavigation<Navigation>();
  const toast = useToast();
  const user = useAppSelector((state) => state.auth.user);
  const [form, setForm] = useState<ContactFormState>(() => emptyContactFromUser(user));
  const [tried, setTried] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof ContactFormState, boolean>>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setForm((prev) => ({ ...emptyContactFromUser(user), message: prev.message }));
  }, [user]);

  const errors = useMemo(() => validateContactForm(form), [form]);
  const showError = (key: keyof ContactFormState) =>
    (tried || touched[key]) && errors[key] ? errors[key] : undefined;

  const setField = <K extends keyof ContactFormState>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    setTried(true);
    if (Object.keys(errors).length > 0) {
      toast.show('Fix the highlighted fields');
      return;
    }
    setSending(true);
    try {
      await submitContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: digitsOnly(form.phone),
        message: form.message.trim(),
      });
      setTried(false);
      setTouched({});
      setForm(emptyContactFromUser(user));
      toast.show('Message sent — we will reply soon');
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen edges={[]} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <Text style={styles.heroTitle}>Reach the forge</Text>
          <Text style={styles.heroSub}>
            Company details below, or send a short message — we will get back to you.
          </Text>

          <Text style={styles.sectionTitle}>Company contact</Text>
          <View style={styles.card}>
            <Text style={styles.companyName}>{COMPANY.name}</Text>
            <Text style={styles.companyLine}>{COMPANY.address}</Text>

            <Pressable
              style={styles.contactRow}
              onPress={() => Linking.openURL(`tel:${COMPANY.phoneTel}`)}
            >
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactLink}>{COMPANY.phone}</Text>
            </Pressable>

            <Pressable
              style={styles.contactRow}
              onPress={() => Linking.openURL(`mailto:${COMPANY.email}`)}
            >
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactLink}>{COMPANY.email}</Text>
            </Pressable>

            <Pressable
              style={styles.contactRow}
              onPress={() => Linking.openURL(COMPANY.whatsappUrl)}
            >
              <Text style={styles.contactLabel}>WhatsApp</Text>
              <Text style={styles.contactLink}>{COMPANY.whatsapp}</Text>
            </Pressable>

            <View style={[styles.contactRow, styles.contactRowLast]}>
              <Text style={styles.contactLabel}>Hours</Text>
              <Text style={styles.contactValue}>{COMPANY.hours}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Send a message</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={[styles.input, showError('name') ? styles.inputError : null]}
              placeholder="Your full name"
              placeholderTextColor={colors.textMuted}
              value={form.name}
              onChangeText={(text) => setField('name', text)}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              autoCapitalize="words"
              maxLength={60}
            />
            {showError('name') ? <Text style={styles.error}>{showError('name')}</Text> : null}

            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={[styles.input, showError('email') ? styles.inputError : null]}
              placeholder="you@email.com"
              placeholderTextColor={colors.textMuted}
              value={form.email}
              onChangeText={(text) => setField('email', text)}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
            {showError('email') ? <Text style={styles.error}>{showError('email')}</Text> : null}

            <Text style={styles.fieldLabel}>Phone</Text>
            <TextInput
              style={[styles.input, showError('phone') ? styles.inputError : null]}
              placeholder="10-digit mobile"
              placeholderTextColor={colors.textMuted}
              value={form.phone}
              onChangeText={(text) => setField('phone', digitsOnly(text).slice(0, 10))}
              onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
              keyboardType="phone-pad"
              maxLength={10}
            />
            {showError('phone') ? <Text style={styles.error}>{showError('phone')}</Text> : null}

            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput
              style={[
                styles.input,
                styles.messageInput,
                showError('message') ? styles.inputError : null,
              ]}
              placeholder="How can we help?"
              placeholderTextColor={colors.textMuted}
              value={form.message}
              onChangeText={(text) => setField('message', text)}
              onBlur={() => setTouched((prev) => ({ ...prev, message: true }))}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
            {showError('message') ? <Text style={styles.error}>{showError('message')}</Text> : null}

            <Pressable
              style={[styles.submitBtn, sending && styles.submitDisabled]}
              onPress={submit}
              disabled={sending}
            >
              <Text style={styles.submitText}>{sending ? 'Sending…' : 'Send message'}</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => navigation.navigate('RaiseQuery')} style={styles.queryLink}>
            <Text style={styles.queryLinkText}>
              Have an order issue? <Text style={styles.queryLinkStrong}>Raise a query</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  companyLine: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
    marginTop: 4,
  },
  companyName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  contactLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  contactLink: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  contactRow: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
  },
  contactRowLast: {
    paddingBottom: 0,
  },
  contactValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: spacing.sm,
    marginTop: -6,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  flex: {
    flex: 1,
  },
  heroSub: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    marginBottom: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: colors.danger,
    marginBottom: 6,
  },
  messageInput: {
    minHeight: 110,
    paddingTop: 12,
  },
  queryLink: {
    marginBottom: spacing.md,
  },
  queryLinkStrong: {
    color: colors.text,
    fontWeight: '800',
  },
  queryLinkText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  submitBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    marginTop: spacing.xs,
    paddingVertical: 14,
  },
  submitDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '800',
  },
});
