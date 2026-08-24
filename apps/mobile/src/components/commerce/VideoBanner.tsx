import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../theme/tokens';
import { appConfig } from '../../config/appConfig';

type Props = {
  onPress?: () => void;
};

export function VideoBanner({ onPress }: Props) {
  const hasLink = Boolean(appConfig.videoBanner.uri);

  return (
    <Pressable style={styles.card} onPress={onPress} disabled={!onPress}>
      <Image source={{ uri: appConfig.videoBanner.poster }} style={styles.poster} resizeMode="cover" />
      <View style={styles.overlay}>
        <View style={styles.play}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
        <Text style={styles.kicker}>{hasLink ? 'Watch drop' : 'Video drop'}</Text>
        <Text style={styles.title}>
          {hasLink ? 'Live from the forge' : 'Video coming soon'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    height: 180,
    overflow: 'hidden',
  },
  kicker: {
    color: colors.onAccent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.md,
  },
  play: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 56,
  },
  playIcon: {
    color: colors.text,
    fontSize: 20,
    marginLeft: 3,
  },
  poster: {
    height: '100%',
    width: '100%',
  },
  title: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
});
