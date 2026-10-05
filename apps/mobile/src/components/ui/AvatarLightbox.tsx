import { Image, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, spacing } from '../../theme/tokens';

type Props = {
  visible: boolean;
  uri?: string;
  initial?: string;
  onClose: () => void;
};

/** Instagram-style full-screen avatar preview (tap backdrop / Close to dismiss). */
export function AvatarLightbox({ visible, uri, initial = '?', onClose }: Props) {
  const { width } = useWindowDimensions();
  const size = Math.min(width * 0.72, 320);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close photo" />
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]} pointerEvents="none">
          {uri ? (
            <Image
              source={{ uri }}
              style={{ width: size, height: size, borderRadius: size / 2 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.fallback,
                { width: size, height: size, borderRadius: size / 2 },
              ]}
            >
              <Text style={[styles.fallbackText, { fontSize: size * 0.42 }]}>
                {initial.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    flex: 1,
    justifyContent: 'center',
  },
  circle: {
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.xl + 24,
    zIndex: 2,
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  fallback: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    justifyContent: 'center',
  },
  fallbackText: {
    color: colors.onAccent,
    fontWeight: '800',
  },
});
