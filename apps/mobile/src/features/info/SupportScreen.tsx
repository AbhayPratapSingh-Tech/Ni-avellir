import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useToast } from '../../components/ui/Toast';
import { useAppSelector } from '../../app/store';
import { digitsOnly } from '../../lib/addressValidation';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[a-zA-Z][a-zA-Z\s.'-]{1,59}$/;
const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;

const COMPANY = {
  name: 'Niðavellir Forge Pvt. Ltd.',
  address: '12 Forge Lane, Indiranagar\nBengaluru, Karnataka 560038',
  phone: '+91 80 4567 8901',
  phoneTel: '+918045678901',
  email: 'support@nidavellir.app',
  hours: 'Mon–Sat, 10:00–18:00 IST',
  whatsapp: '+91 98765 43210',
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  comment: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function emptyFormFromUser(user: {
  name?: string;
  email?: string;
  phone?: string;
  isGuest?: boolean;
} | null): FormState {
  if (!user || user.isGuest) {
    return { name: '', email: '', phone: '', comment: '' };
  }
  return {
    name: user.name || '',
    email: user.email || '',
    phone: digitsOnly(user.phone || ''),
    comment: '',
  };
}

function validateEnquiry(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const name = form.name.trim();
  const email = form.email.trim();
  const phone = digitsOnly(form.phone);
  const comment = form.comment.trim();

  if (!name) errors.name = 'Name is required';
  else if (name.length < 2) errors.name = 'Enter at least 2 characters';
  else if (!NAME_RE.test(name)) errors.name = 'Use letters only (spaces, . \' - allowed)';

  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address';

  if (!phone) errors.phone = 'Phone number is required';
  else if (phone.length !== 10) errors.phone = 'Enter a valid 10-digit mobile number';
  else if (!INDIAN_MOBILE_RE.test(phone)) errors.phone = 'Mobile number must start with 6–9';

  if (!comment) errors.comment = 'Please write your query';
  else if (comment.length < 10) errors.comment = 'Add a bit more detail (at least 10 characters)';
  else if (comment.length > 1000) errors.comment = 'Query is too long (max 1000 characters)';

  return errors;
}

export function SupportScreen() {
  const toast = useToast();
  const user = useAppSelector((state) => state.auth.user);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => emptyFormFromUser(user));
  const [tried, setTried] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (formOpen) return;
    setForm(emptyFormFromUser(user));
  }, [user, formOpen]);

  const errors = useMemo(() => validateEnquiry(form), [form]);

  const showError = (key: keyof FormState) =>
    (tried || touched[key]) && errors[key] ? errors[key] : undefined;

  const setField = <K extends keyof FormState>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openEnquiry = () => {
    setForm(emptyFormFromUser(user));
    setTried(false);
    setTouched({});
    setFormOpen(true);
  };

  const closeEnquiry = () => {
    if (sending) return;
    setFormOpen(false);
  };

  const submit = () => {
    setTried(true);
    if (Object.keys(errors).length > 0) {
      toast.show('Fix the highlighted fields');
      return;
    }

    setSending(true);
    // Demo: no backend yet — acknowledge locally. Live: POST /api/v1/support/enquiries
    setTimeout(() => {
      setSending(false);
      setFormOpen(false);
      setTried(false);
      setTouched({});
      setForm(emptyFormFromUser(user));
      toast.show('Query sent — we will reply soon');
    }, 450);
  };

  return (
    <Screen edges={[]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heroTitle}>We’re here to help</Text>
        <Text style={styles.heroSub}>
          Reach the forge team with order questions, returns, or product help.
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

          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>WhatsApp</Text>
            <Text style={styles.contactValue}>{COMPANY.whatsapp}</Text>
          </View>

          <View style={[styles.contactRow, styles.contactRowLast]}>
            <Text style={styles.contactLabel}>Hours</Text>
            <Text style={styles.contactValue}>{COMPANY.hours}</Text>
          </View>
        </View>

        <Pressable style={styles.openBtn} onPress={openEnquiry}>
          <Text style={styles.openBtnText}>Contact Support!</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={formOpen}
        animationType="slide"
        transparent
        onRequestClose={closeEnquiry}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalAvoid}
          >
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Enquiry form</Text>
                <Pressable onPress={closeEnquiry} hitSlop={10} disabled={sending}>
                  <Text style={styles.modalClose}>Close</Text>
                </Pressable>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.modalBody}
              >
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

                <Text style={styles.fieldLabel}>Number</Text>
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

                <Text style={styles.fieldLabel}>Comment</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.commentInput,
                    showError('comment') ? styles.inputError : null,
                  ]}
                  placeholder="write your query here"
                  placeholderTextColor={colors.textMuted}
                  value={form.comment}
                  onChangeText={(text) => setField('comment', text)}
                  onBlur={() => setTouched((prev) => ({ ...prev, comment: true }))}
                  multiline
                  textAlignVertical="top"
                  maxLength={1000}
                />
                {showError('comment') ? (
                  <Text style={styles.error}>{showError('comment')}</Text>
                ) : null}
              </ScrollView>

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelBtn} onPress={closeEnquiry} disabled={sending}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.submitBtn, sending && styles.submitDisabled]}
                  onPress={submit}
                  disabled={sending}
                >
                  <Text style={styles.submitText}>{sending ? 'Sending…' : 'Send'}</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cancelBtn: {
    flex: 1,
    marginRight: spacing.sm,
    paddingVertical: 14,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  commentInput: {
    minHeight: 120,
    paddingTop: 12,
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
  modalActions: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  modalAvoid: {
    justifyContent: 'flex-end',
    maxHeight: '92%',
  },
  modalBackdrop: {
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBody: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  modalClose: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  openBtn: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingVertical: 14,
  },
  openBtnText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '800',
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
    flex: 1.4,
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
