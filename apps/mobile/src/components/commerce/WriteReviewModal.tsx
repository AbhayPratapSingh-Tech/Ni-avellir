import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors, spacing } from '../../theme/tokens';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { appConfig } from '../../config/appConfig';
import { requireLogin, isLoggedInUser } from '../../lib/authGates';
import { updateProfile } from '../../features/auth/authSlice';
import { getApiErrorMessage } from '../../services/api/apiClient';
import { authRepository } from '../../services/data/authRepository';
import { isDisplayAvatarUrl, reviewRepository } from '../../services/data/reviewRepository';
import type { ProductReview } from '../../services/data/reviews';
import { CenteredModalClose, CenteredModalShell } from '../ui/CenteredModalClose';
import { StarRating } from '../ui/StarRating';
import { useToast } from '../ui/Toast';

const TITLE_MAX = 70;
const BODY_MAX = 1500;

type Props = {
  visible: boolean;
  productId: string;
  onClose: () => void;
  onCreated: (review: ProductReview) => void;
};

export function WriteReviewModal({ visible, productId, onClose, onCreated }: Props) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const cardMaxHeight = Math.min(height - insets.top - insets.bottom - 56, height * 0.88);
  const user = useAppSelector((state) => state.auth.user);
  const loggedIn = isLoggedInUser(user);

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [rating, setRating] = useState(5);
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setName(loggedIn ? user?.name ?? '' : '');
    setTitle('');
    setBody('');
    setRating(5);
    setImageUri(undefined);
    setBusy(false);
  }, [loggedIn, user?.name, visible]);

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
      maxWidth: 1024,
      maxHeight: 1024,
      selectionLimit: 1,
    });
    const uri = result.assets?.[0]?.uri;
    if (uri) {
      setImageUri(uri);
    }
  };

  const submit = async () => {
    const displayName = (loggedIn ? user?.name ?? '' : name).trim();
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!displayName) {
      toast.show('Add your name');
      return;
    }
    if (!trimmedTitle) {
      toast.show('Add a review title');
      return;
    }
    if (!trimmedBody) {
      toast.show('Add a review');
      return;
    }
    if (appConfig.dataSource === 'api' && !requireLogin({ user, dispatch, toast, reason: 'review' })) {
      return;
    }
    setBusy(true);
    try {
      const remoteImage =
        imageUri && (imageUri.startsWith('https://') || imageUri.startsWith('http://'))
          ? imageUri
          : undefined;
      let avatarUrl = loggedIn ? user?.avatarUri : undefined;
      if (loggedIn && appConfig.dataSource === 'api') {
        try {
          const me = await authRepository.me();
          if (me?.avatarUrl) {
            avatarUrl = me.avatarUrl;
          }
        } catch {
          // Keep Redux photo if /me is slow.
        }
        const localOnly =
          Boolean(avatarUrl) &&
          (avatarUrl!.startsWith('file:') || avatarUrl!.startsWith('content:') || avatarUrl!.startsWith('ph://'));
        if (localOnly) {
          const updated = await authRepository.uploadAvatar(avatarUrl!);
          avatarUrl = updated.avatarUrl ?? avatarUrl;
          dispatch(updateProfile({ avatarUri: updated.avatarUrl ?? null }));
        }
      }
      const created = await reviewRepository.create({
        productId,
        name: displayName,
        rating,
        title: trimmedTitle.slice(0, TITLE_MAX),
        body: trimmedBody.slice(0, BODY_MAX),
        userId: loggedIn ? user?.id || user?.email : undefined,
        avatarUrl: isDisplayAvatarUrl(avatarUrl) ? avatarUrl : undefined,
        imageUrl: remoteImage,
      });
      onCreated(created);
      onClose();
      toast.show('Review submitted');
    } catch (error) {
      toast.show(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
          pointerEvents="box-none"
        >
          <CenteredModalShell>
            <CenteredModalClose onPress={onClose} />
            <View style={[styles.card, { maxHeight: cardMaxHeight }]} pointerEvents="auto">
            <ScrollView
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.heading}>Rate your purchase experience</Text>
              <View style={styles.stars}>
                <StarRating rating={rating} size={32} onChange={setRating} />
              </View>
              {!loggedIn ? (
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  showSoftInputOnFocus
                />
              ) : null}
              <Text style={styles.label}>
                1. Title <Text style={styles.hint}>(Max {TITLE_MAX} Characters)</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Beautiful finish"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={(value) => setTitle(value.slice(0, TITLE_MAX))}
                maxLength={TITLE_MAX}
                showSoftInputOnFocus
                blurOnSubmit={false}
              />
              <Text style={styles.label}>
                2. Your experience <Text style={styles.hint}>(Max {BODY_MAX} Characters)</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.inputArea]}
                placeholder="How was the gear?"
                placeholderTextColor={colors.textMuted}
                value={body}
                onChangeText={(value) => setBody(value.slice(0, BODY_MAX))}
                maxLength={BODY_MAX}
                multiline
                showSoftInputOnFocus
                textAlignVertical="top"
              />
              <Text style={styles.imageLabel}>Image</Text>
              <Pressable style={styles.imageBox} onPress={() => void pickImage()} accessibilityLabel="Add image">
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.preview} />
                ) : (
                  <Text style={styles.plus}>+</Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.submit, busy && styles.submitDisabled]}
                onPress={() => void submit()}
                disabled={busy}
              >
                <Text style={styles.submitText}>{busy ? 'Submitting…' : 'Submit'}</Text>
              </Pressable>
            </ScrollView>
            </View>
          </CenteredModalShell>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    flexShrink: 1,
    marginHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  heading: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'none',
  },
  imageBox: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#EEF1F5',
    borderColor: colors.border,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
    overflow: 'hidden',
    width: 120,
  },
  imageLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  inputArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  overlay: {
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'center',
    overflow: 'visible',
  },
  plus: {
    color: colors.textMuted,
    fontSize: 28,
    fontWeight: '300',
  },
  preview: {
    height: '100%',
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.sm,
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'visible',
    paddingVertical: 36,
  },
  stars: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  submit: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 28,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: colors.onAccent,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
