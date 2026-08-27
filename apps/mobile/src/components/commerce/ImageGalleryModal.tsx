import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/tokens';
import { ImagePager } from './ImagePager';

type Props = {
  visible: boolean;
  images: string[];
  startIndex?: number;
  onClose: () => void;
};

export function ImageGalleryModal({ visible, images, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Gallery</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>
        <View style={styles.body}>
          <ImagePager images={images} height={520} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  close: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  safe: {
    backgroundColor: '#0B0D12',
    flex: 1,
  },
  title: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '800',
  },
});
