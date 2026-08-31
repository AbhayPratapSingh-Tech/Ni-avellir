import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useToast } from '../../components/ui/Toast';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { updateProfile } from '../auth/authSlice';
import { appConfig } from '../../config/appConfig';
import { authRepository } from '../../services/data/authRepository';
import { digitsOnly } from '../../lib/addressValidation';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[a-zA-Z][a-zA-Z\s.'-]{1,59}$/;
const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;

const PRESET_AVATARS = [
  'https://i.pravatar.cc/240?img=12',
  'https://i.pravatar.cc/240?img=32',
  'https://i.pravatar.cc/240?img=5',
  'https://i.pravatar.cc/240?img=15',
  'https://i.pravatar.cc/240?img=47',
  'https://i.pravatar.cc/240?img=8',
  'https://i.pravatar.cc/240?img=25',
  'https://i.pravatar.cc/240?img=44',
  'https://i.pravatar.cc/240?img=18',
  'https://i.pravatar.cc/240?img=36',
  'https://i.pravatar.cc/240?img=3',
  'https://i.pravatar.cc/240?img=68',
];

const PICKER_OPTIONS = {
  mediaType: 'photo' as const,
  quality: 0.8 as const,
  maxWidth: 800,
  maxHeight: 800,
  selectionLimit: 1,
};

type ProfileErrors = Partial<{ name: string; email: string; phone: string }>;

function validateProfile(fields: { name: string; email: string; phone: string }): ProfileErrors {
  const errors: ProfileErrors = {};
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

  return errors;
}

async function ensureAndroidCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const already = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
  if (already) {
    return true;
  }

  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
    title: 'Camera permission',
    message: 'Niðavellir needs camera access so you can take a profile photo.',
    buttonNeutral: 'Ask me later',
    buttonNegative: 'Cancel',
    buttonPositive: 'OK',
  });

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export function EditProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const user = useAppSelector((state) => state.auth.user);

  const [name, setName] = useState(user?.isGuest ? '' : (user?.name ?? ''));
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [avatarUri, setAvatarUri] = useState<string | undefined>(user?.avatarUri);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [tried, setTried] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof ProfileErrors, boolean>>>({});

  const errors = useMemo(() => validateProfile({ name, email, phone }), [name, email, phone]);

  const showError = (key: keyof ProfileErrors) =>
    (tried || touched[key]) && errors[key] ? errors[key] : undefined;

  const goBackToAccount = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('MainTabs', { screen: 'Account' });
  };

  const applyPickedUri = (uri?: string | null) => {
    if (!uri) {
      return;
    }
    setAvatarUri(uri);
  };

  const openLibrary = async () => {
    const result = await launchImageLibrary(PICKER_OPTIONS);
    if (result.didCancel) return;
    if (result.errorCode) {
      toast.show(result.errorMessage || 'Could not open gallery');
      return;
    }
    applyPickedUri(result.assets?.[0]?.uri);
  };

  const openCamera = async () => {
    const allowed = await ensureAndroidCameraPermission();
    if (!allowed) {
      toast.show('Camera permission is required');
      return;
    }

    const result = await launchCamera(PICKER_OPTIONS);
    if (result.didCancel) return;
    if (result.errorCode) {
      toast.show(result.errorMessage || 'Could not open camera');
      return;
    }
    applyPickedUri(result.assets?.[0]?.uri);
  };

  const openPhotoMenu = () => {
    Alert.alert('Profile photo', 'Choose how to update your photo', [
      { text: 'Photo library', onPress: () => void openLibrary() },
      { text: 'Camera', onPress: () => void openCamera() },
      { text: 'Choose avatar', onPress: () => setPresetsOpen(true) },
      ...(avatarUri
        ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: () => setAvatarUri(undefined) }]
        : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const save = async () => {
    if (!user) {
      goBackToAccount();
      return;
    }

    setTried(true);
    if (Object.keys(errors).length > 0) {
      return;
    }

    if (appConfig.dataSource === 'api') {
      try {
        const updated = await authRepository.updateProfile({
          name: name.trim(),
          email: email.trim(),
          avatarUrl: avatarUri,
        });
        dispatch(
          updateProfile({
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            avatarUri: updated.avatarUrl ?? null,
          }),
        );
      } catch (error) {
        toast.show(authRepository.getApiErrorMessage(error));
        return;
      }
    } else {
      dispatch(
        updateProfile({
          name: name.trim(),
          email: email.trim(),
          avatarUri: avatarUri ?? null,
        }),
      );
    }
    toast.show('Profile updated');
    goBackToAccount();
  };

  const initial = name.trim().charAt(0).toUpperCase() || 'N';

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
          <Pressable style={styles.avatarWrap} onPress={openPhotoMenu}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraBadgeText}>✎</Text>
            </View>
          </Pressable>
          <Pressable onPress={openPhotoMenu} hitSlop={8}>
            <Text style={styles.changePhoto}>Change photo</Text>
          </Pressable>
          <Text style={styles.hint}>Update how you appear across orders and checkout.</Text>

          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={[styles.input, showError('name') ? styles.inputError : null]}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            autoCapitalize="words"
            maxLength={60}
          />
          {showError('name') ? <Text style={styles.error}>{showError('name')}</Text> : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, showError('email') ? styles.inputError : null]}
            placeholder="you@email.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
          {showError('email') ? <Text style={styles.error}>{showError('email')}</Text> : null}

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            placeholder="10-digit mobile"
            placeholderTextColor={colors.textMuted}
            value={phone}
            editable={false}
            keyboardType="phone-pad"
          />
          <Text style={styles.fieldHint}>Phone number cannot be changed after signup.</Text>

          <Pressable style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveText}>Save changes</Text>
          </Pressable>
          <Pressable onPress={goBackToAccount} hitSlop={8}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={presetsOpen} transparent animationType="fade" onRequestClose={() => setPresetsOpen(false)}>
        <View style={styles.presetOverlay}>
          <Pressable style={styles.presetBackdrop} onPress={() => setPresetsOpen(false)} />
          <View style={styles.presetSheet}>
            <Text style={styles.presetTitle}>Choose an avatar</Text>
            <View style={styles.presetGrid}>
              {PRESET_AVATARS.map((uri) => (
                <Pressable
                  key={uri}
                  style={[styles.presetItem, avatarUri === uri && styles.presetItemActive]}
                  onPress={() => {
                    setAvatarUri(uri);
                    setPresetsOpen(false);
                  }}
                >
                  <Image source={{ uri }} style={styles.presetImage} />
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => setPresetsOpen(false)}>
              <Text style={styles.cancel}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 48,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  avatarImage: {
    borderRadius: 48,
    height: 96,
    width: 96,
  },
  avatarText: {
    color: colors.onAccent,
    fontSize: 36,
    fontWeight: '800',
  },
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  cameraBadge: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderColor: colors.surface,
    borderRadius: 14,
    borderWidth: 2,
    bottom: 0,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 28,
  },
  cameraBadgeText: {
    color: colors.onAccent,
    fontSize: 12,
    fontWeight: '700',
  },
  cancel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  changePhoto: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: spacing.md,
    marginTop: -8,
  },
  flex: {
    flex: 1,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: colors.danger,
    marginBottom: 6,
  },
  inputDisabled: {
    backgroundColor: colors.background,
    color: colors.textMuted,
    opacity: 0.85,
  },
  fieldHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.md,
    marginTop: -8,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  presetBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  presetImage: {
    borderRadius: 32,
    height: 64,
    width: 64,
  },
  presetItem: {
    borderColor: 'transparent',
    borderRadius: 34,
    borderWidth: 2,
    marginBottom: spacing.sm,
    padding: 2,
  },
  presetItemActive: {
    borderColor: colors.accent,
  },
  presetOverlay: {
    backgroundColor: 'rgba(17, 19, 24, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  presetSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  presetTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    marginTop: spacing.sm,
    paddingVertical: 14,
  },
  saveText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
