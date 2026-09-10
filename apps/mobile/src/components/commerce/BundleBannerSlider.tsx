import { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { getBundleDisplayHint } from '@nidavellir/shared';
import { colors, spacing } from '../../theme/tokens';
import type { CatalogBundle } from '../../services/data/productRepository';
import { CachedImage } from '../ui/CachedImage';

type Props = {
  bundles: CatalogBundle[];
  onPressBundle: (bundle: CatalogBundle) => void;
};

export function BundleBannerSlider({ bundles, onPressBundle }: Props) {
  const { width } = useWindowDimensions();
  const slideWidth = width - spacing.md * 2;
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<CatalogBundle>>(null);

  if (!bundles.length) return null;

  return (
    <View>
      <FlatList
        ref={listRef}
        data={bundles}
        keyExtractor={(item) => item.tag}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={slideWidth + spacing.sm}
        contentContainerStyle={{ gap: spacing.sm }}
        onMomentumScrollEnd={(e) => {
          const next = Math.round(e.nativeEvent.contentOffset.x / (slideWidth + spacing.sm));
          setIndex(next);
        }}
        renderItem={({ item }) => {
          const hint = getBundleDisplayHint(item.tag);
          const banner = hint?.bannerImage || item.bannerImage;
          const title = hint?.name || item.name;
          const sub = hint?.subtitle || item.subtitle;
          return (
            <Pressable
              style={[styles.slide, { width: slideWidth }]}
              onPress={() => onPressBundle(item)}
            >
              <CachedImage uri={banner} style={styles.image} priority="normal" />
              <View style={styles.overlay}>
                <Text style={styles.kicker}>{item.tag}</Text>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.sub}>{sub}</Text>
              </View>
            </Pressable>
          );
        }}
      />
      <View style={styles.dots}>
        {bundles.map((b, i) => (
          <View key={b.tag} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    backgroundColor: colors.border,
    borderRadius: 3,
    height: 6,
    marginHorizontal: 3,
    width: 6,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 14,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  kicker: {
    color: colors.onAccent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    opacity: 0.9,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  slide: {
    borderRadius: 18,
    height: 160,
    overflow: 'hidden',
  },
  sub: {
    color: colors.onAccent,
    fontSize: 13,
    marginTop: 2,
    opacity: 0.9,
  },
  title: {
    color: colors.onAccent,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
});
