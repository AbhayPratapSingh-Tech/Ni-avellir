import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Product } from '@nidavellir/shared';
import { colors, spacing, typography } from '../../theme/tokens';
import { ProductCard } from '../../components/commerce/ProductCard';
import { useCountdown } from '../../hooks/useCountdown';
import { productRepository } from '../../services/data/productRepository';
import { useAppDispatch } from '../../app/store';
import { addItem } from '../cart/cartSlice';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const heroSlides = [
  {
    id: 'h1',
    title: 'Forged for Legends',
    subtitle: 'Limited-run collectibles drop now',
    image:
      'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'h2',
    title: 'New Season Gear',
    subtitle: 'Apparel & desk essentials restocked',
    image:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'h3',
    title: 'RGB Forge Collection',
    subtitle: 'Deskmats with living edge lighting',
    image:
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1200&q=80',
  },
];

function GlowRing() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.25, { duration: 1200 }), withTiming(1, { duration: 1200 })),
      -1,
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0.1, { duration: 1200 }), withTiming(0.5, { duration: 1200 })),
      -1,
    );
  }, [opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.glowRing, style]} />;
}

function HeroCarousel() {
  const listRef = useRef<FlatList<typeof heroSlides[number]>>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % heroSlides.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  return (
    <View>
      <FlatList
        ref={listRef}
        data={heroSlides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / 340))
        }
        renderItem={({ item }) => (
          <View style={styles.heroSlide}>
            <Image source={{ uri: item.image }} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroOverlay}>
              <GlowRing />
              <Text style={styles.heroTitle}>{item.title}</Text>
              <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />
      <View style={styles.dots}>
        {heroSlides.map((s, i) => (
          <View key={s.id} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

function FlashSaleBar() {
  const target = Date.now() + 3600 * 1000 * 7 + 1000 * 52;
  const { hours, minutes, seconds } = useCountdown(target);
  return (
    <View style={styles.flashSale}>
      <Text style={styles.flashTitle}>⚡ Flash Drop ends in</Text>
      <View style={styles.timerRow}>
        {[hours, minutes, seconds].map((v, i) => (
          <View key={i} style={styles.timerCell}>
            <Text style={styles.timerValue}>{v}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const dispatch = useAppDispatch();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    productRepository.getFeatured().then(setFeatured);
    productRepository.getCategories().then(setCategories);
  }, []);

  const handleAdd = useCallback(
    (product: Product) => {
      dispatch(addItem({ product, quantity: 1 }));
    },
    [dispatch],
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Niðavellir</Text>
        <Text style={styles.headerTitle}>Forge & Wear</Text>
      </View>

      <HeroCarousel />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Flash Drop</Text>
        <FlashSaleBar />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              style={styles.categoryChip}
onPress={() => navigation.navigate('Products')}
            >
              <Text style={styles.categoryChipText}>{cat.replace('-', ' ')}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Forge</Text>
<Pressable onPress={() => navigation.navigate('Products')}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>
        <View style={styles.grid}>
          {featured.map((product) => (
            <View key={product.id} style={styles.gridItem}>
              <ProductCard
                product={product}
                onPress={(p) => navigation.navigate('ProductDetail', { product: p })}
                onAddToCart={handleAdd}
              />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    backgroundColor: colors.accent,
  },
  categoryChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dot: {
    backgroundColor: colors.border,
    borderRadius: 4,
    height: 6,
    marginHorizontal: 3,
    width: 6,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 18,
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  flashSale: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  flashTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  glowRing: {
    borderColor: colors.accent,
    borderRadius: 999,
    borderWidth: 2,
    height: 220,
    opacity: 0.4,
    position: 'absolute',
    width: 220,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '50%',
  },
  header: {
    paddingVertical: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
  },
  heroImage: {
    height: 220,
    width: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(9,10,15,0.55)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  heroSlide: {
    borderRadius: 18,
    height: 220,
    overflow: 'hidden',
    width: 340,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  kicker: {
    color: colors.accent,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  screenContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  seeAll: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  timerCell: {
    backgroundColor: colors.background,
    borderRadius: 8,
    marginLeft: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  timerRow: {
    flexDirection: 'row',
  },
  timerValue: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
