import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useToast } from '../../components/ui/Toast';
import { appConfig } from '../../config/appConfig';
import { authRepository } from '../../services/data/authRepository';
import { digitsOnly } from '../../lib/addressValidation';
import type { AuthStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<AuthStackParamList>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[a-zA-Z][a-zA-Z\s.'-]{1,59}$/;
const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;

type SignupErrors = Partial<{ name: string; email: string; phone: string; password: string; confirm: string }>;

function validateSignup(fields: {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
}): SignupErrors {
  const errors: SignupErrors = {};
  const name = fields.name.trim();
  const email = fields.email.trim();
  const phone = digitsOnly(fields.phone);

  if (!name) errors.name = 'Full name is required';
  else if (name.length < 2) errors.name = 'Enter at least 2 characters';
  else if (!NAME_RE.test(name)) errors.name = 'Use letters only (spaces, . \' - allowed)';

  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address';

  if (!phone) errors.phone = 'Phone number is required';
  else if (phone.length !== 10) errors.phone = 'Enter a valid 10-digit mobile number';
  else if (!INDIAN_MOBILE_RE.test(phone)) errors.phone = 'Mobile number must start with 6–9';

  if (!fields.password) errors.password = 'Password is required';
  else if (fields.password.length < 8) errors.password = 'Password must be at least 8 characters';

  if (!fields.confirm) errors.confirm = 'Confirm your password';
  else if (fields.password !== fields.confirm) errors.confirm = 'Passwords do not match';

  return errors;
}

export function SignupScreen() {
  const navigation = useNavigation<Navigation>();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [tried, setTried] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof SignupErrors, boolean>>>({});
  const [remoteErrors, setRemoteErrors] = useState<SignupErrors>({});

  const errors = useMemo(
    () => ({ ...validateSignup({ name, email, phone, password, confirm }), ...remoteErrors }),
    [name, email, phone, password, confirm, remoteErrors],
  );

  const showError = (key: keyof SignupErrors) =>
    (tried || touched[key]) && errors[key] ? errors[key] : undefined;

  const submit = async () => {
    setTried(true);
    setRemoteErrors({});
    const localErrors = validateSignup({ name, email, phone, password, confirm });
    if (Object.keys(localErrors).length > 0) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const normalizedPhone = digitsOnly(phone);

    if (appConfig.dataSource === 'api') {
      setLoading(true);
      try {
        const availability = await authRepository.checkRegistration({
          email: trimmedEmail,
          phone: normalizedPhone,
        });
        const availabilityErrors: SignupErrors = {};
        if (!availability.emailAvailable) {
          availabilityErrors.email =
            availability.emailMessage ?? 'This email is already registered';
        }
        if (!availability.phoneAvailable) {
          availabilityErrors.phone =
            availability.phoneMessage ?? 'This phone number is already registered';
        }
        if (Object.keys(availabilityErrors).length > 0) {
          setRemoteErrors(availabilityErrors);
          setTouched((prev) => ({ ...prev, email: true, phone: true }));
          if (availabilityErrors.email && availabilityErrors.phone) {
            toast.show('Email and phone are already registered — try Login');
          } else if (availabilityErrors.email) {
            toast.show(availabilityErrors.email);
          } else if (availabilityErrors.phone) {
            toast.show(availabilityErrors.phone);
          }
          return;
        }

        const result = await authRepository.register({
          name: trimmedName,
          email: trimmedEmail,
          phone: normalizedPhone,
          password,
        });
        navigation.navigate('Otp', {
          name: trimmedName,
          email: trimmedEmail,
          phone: normalizedPhone,
          password,
          purpose: 'verify_email',
          devVerifyCode: result.emailVerification?.demoCode,
        });
      } catch (error) {
        const message = authRepository.getApiErrorMessage(error);
        const apiErrors: SignupErrors = {};
        if (message.toLowerCase().includes('email')) {
          apiErrors.email = message;
          setTouched((prev) => ({ ...prev, email: true }));
        }
        if (message.toLowerCase().includes('phone')) {
          apiErrors.phone = message;
          setTouched((prev) => ({ ...prev, phone: true }));
        }
        if (Object.keys(apiErrors).length > 0) {
          setRemoteErrors(apiErrors);
        }
        toast.show(message);
      } finally {
        setLoading(false);
      }
      return;
    }
    navigation.navigate('Otp', {
      name: trimmedName,
      email: trimmedEmail,
      phone: normalizedPhone,
    });
  };

  return (
    <Screen edges={[]} style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={styles.sub}>Create an account to start the forge.</Text>

        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={[styles.input, showError('name') ? styles.inputError : null]}
          placeholder="Full name"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
          autoCapitalize="words"
        />
        {showError('name') ? <Text style={styles.error}>{showError('name')}</Text> : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, showError('email') ? styles.inputError : null]}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setRemoteErrors((prev) => ({ ...prev, email: undefined }));
            if (touched.email) setTouched((prev) => ({ ...prev, email: true }));
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
        />
        {showError('email') ? <Text style={styles.error}>{showError('email')}</Text> : null}

        <Text style={styles.label}>Phone number</Text>
        <TextInput
          style={[styles.input, showError('phone') ? styles.inputError : null]}
          placeholder="10-digit mobile"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(value) => {
            setPhone(digitsOnly(value).slice(0, 10));
            setRemoteErrors((prev) => ({ ...prev, phone: undefined }));
            if (touched.phone) setTouched((prev) => ({ ...prev, phone: true }));
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
          maxLength={10}
        />
        {showError('phone') ? <Text style={styles.error}>{showError('phone')}</Text> : null}

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={[styles.input, showError('password') ? styles.inputError : null]}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
        />
        {showError('password') ? <Text style={styles.error}>{showError('password')}</Text> : null}

        <Text style={styles.label}>Confirm password</Text>
        <TextInput
          style={[styles.input, showError('confirm') ? styles.inputError : null]}
          placeholder="Confirm password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          onBlur={() => setTouched((prev) => ({ ...prev, confirm: true }))}
        />
        {showError('confirm') ? <Text style={styles.error}>{showError('confirm')}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.cta, (pressed || loading) && styles.ctaPressed]}
          onPress={submit}
          disabled={loading}
        >
          {({ pressed }) => (
            <Text style={[styles.ctaText, pressed && styles.ctaTextPressed]}>
              {loading ? 'Checking…' : 'Create account'}
            </Text>
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
  error: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: spacing.md,
    marginTop: -8,
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
  inputError: {
    borderColor: colors.danger,
    marginBottom: 6,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
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
