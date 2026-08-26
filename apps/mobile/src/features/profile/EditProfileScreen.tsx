import { useState } from 'react';
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
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const save = () => {
    if (!user) {
      goBackToAccount();
      return;
    }

    const nextName = name.trim();
    const nextEmail = email.trim();
    const nextPhone = phone.replace(/\D/g, '');

    if (!nextName) {
      toast.show('Enter your name');
      return;
    }
    if (!nextEmail || !EMAIL_RE.test(nextEmail)) {
      toast.show('Enter a valid email');
      return;
    }
    if (nextPhone.length !== 10) {
      toast.show('Enter a 10-digit phone');
      return;
    }

    dispatch(
      updateProfile({
        name: nextName,
        email: nextEmail,
        phone: nextPhone,
        avatarUri: avatarUri ?? null,
      }),
    );
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
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@email.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile"
            placeholderTextColor={colors.textMuted}
            value={phone}
            onChangeText={(value) => setPhone(value.replace(/\D/g, '').slice(0, 10))}
            keyboardType="phone-pad"
            maxLength={10}
          />

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
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
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
