import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Product } from '@nidavellir/shared';
import { colors, spacing } from '../../theme/tokens';
import { ProductCard } from '../../components/commerce/ProductCard';
import { SquareProductCard } from '../../components/commerce/SquareProductCard';
import { CategoryCircleSlider } from '../../components/commerce/CategoryCircleSlider';
import { VideoBanner } from '../../components/commerce/VideoBanner';
import { ShopHeader } from '../../components/layout/ShopHeader';
import { ShopDrawer } from '../../components/layout/ShopDrawer';
import { Screen } from '../../components/ui/Screen';
import { useDailySale } from '../../lib/saleWindow';
import { productRepository } from '../../services/data/productRepository';
import type { ShopCategory } from '../../lib/shopCategories';
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

const HERO_BANNER = {
  title: 'Forge week drop',
  subtitle: 'Shop the live catalog',
  image:
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80',
};

const CLOSING_BANNER = {
  title: 'Built for match day',
  subtitle: 'Stage-ready gear, numbered runs, clean desks.',
  image:
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1400&q=80',
};

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
  const listRef = useRef<FlatList<(typeof heroSlides)[number]>>(null);
  const [index, setIndex] = useState(0);
  const slideWidth = 328;
  const gap = 12;
  const stride = slideWidth + gap;

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % heroSlides.length;
        listRef.current?.scrollToOffset({ offset: next * stride, animated: true });
        return next;
      });
    }, 4200);
    return () => clearInterval(timer);
  }, [stride]);

  return (
    <View>
      <FlatList
        ref={listRef}
        data={heroSlides}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={stride}
        decelerationRate="fast"
        contentContainerStyle={{ paddingRight: gap }}
        getItemLayout={(_, i) => ({ length: stride, offset: stride * i, index: i })}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / stride))}
        renderItem={({ item }) => (
          <View style={[styles.heroSlide, { width: slideWidth, marginRight: gap }]}>
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
        {heroSlides.map((slide, i) => (
          <View key={slide.id} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

function FlashSaleBar() {
  const { active, countdown } = useDailySale();

  return (
    <View style={styles.flashSale}>
      <View>
        <Text style={styles.flashKicker}>{active ? 'LIVE DROP' : 'DAILY DROP'}</Text>
        <Text style={styles.flashTitle}>{active ? 'Ends in' : 'Sale soon'}</Text>
      </View>
      {active ? (
        <View style={styles.timerRow}>
          {[
            { v: countdown.hours, l: 'H' },
            { v: countdown.minutes, l: 'M' },
            { v: countdown.seconds, l: 'S' },
          ].map((cell) => (
            <View key={cell.l} style={styles.timerCell}>
              <Text style={styles.timerValue}>{cell.v}</Text>
              <Text style={styles.timerLabel}>{cell.l}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.saleSoonHint}>Opens 9:00 · 7 hrs</Text>
      )}
    </View>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const { width } = useWindowDimensions();
  const [deals, setDeals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [alsoLike, setAlsoLike] = useState<Product[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadShelves = useCallback(() => {
    void productRepository.getDeals().then(setDeals);
    void productRepository.getBestSellers().then(setBestSellers);
    void productRepository.getAlsoLike(6).then(setAlsoLike);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadShelves();
    }, [loadShelves]),
  );

  const openPlp = useCallback(() => {
    navigation.navigate('Products', { title: 'All products' });
  }, [navigation]);

  const openProduct = useCallback(
    (product: Product) => {
      navigation.navigate('ProductDetail', { product });
    },
    [navigation],
  );

  const openCategory = useCallback(
    (item: ShopCategory) => {
      navigation.navigate('Products', {
        title: item.name,
        category: item.category,
        q: item.q,
        collection: item.collection,
      });
    },
    [navigation],
  );

  return (
    <Screen>
      <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
        <ShopHeader onMenuPress={() => setMenuOpen(true)} />
        <ShopDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} />

        <View style={styles.padded}>
          <Pressable style={styles.searchBar} onPress={() => navigation.navigate('Search', {})}>
            <Text style={styles.searchIcon}>⌕</Text>
            <Text style={styles.searchPlaceholder}>Search kits, desks, drops...</Text>
          </Pressable>
          <HeroCarousel />
        </View>

        <Pressable onPress={openPlp} style={styles.fullBanner}>
          <Image source={{ uri: HERO_BANNER.image }} style={[styles.fullBannerImage, { width }]} />
          <View style={styles.fullBannerOverlay} pointerEvents="none">
            <Text style={styles.bannerKicker}>Shop all</Text>
            <Text style={styles.bannerTitle}>{HERO_BANNER.title}</Text>
            <Text style={styles.bannerSub}>{HERO_BANNER.subtitle}</Text>
          </View>
        </Pressable>

        <View style={styles.padded}>
          <View style={styles.section}>
            <FlashSaleBar />
          </View>
          <View style={styles.section}>
            <VideoBanner />
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <CategoryCircleSlider onPress={openCategory} />
          </View>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Deals for you</Text>
              <Pressable
                onPress={() => navigation.navigate('Products', { collection: 'deals', title: 'Deals for you' })}
              >
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            <View style={styles.grid}>
              {deals.map((product) => (
                <View key={product.id} style={styles.gridItem}>
                  <ProductCard product={product} onPress={openProduct} />
                </View>
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Our best sellers</Text>
              <Pressable
                onPress={() =>
                  navigation.navigate('Products', { collection: 'bestsellers', title: 'Top best sellers' })
                }
              >
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bestTrack}>
              {bestSellers.map((product) => (
                <View key={product.id} style={styles.bestCard}>
                  <SquareProductCard product={product} onPress={openProduct} />
                </View>
              ))}
            </ScrollView>
          </View>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>You may also like</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="See all you may also like"
                onPress={() =>
                  navigation.navigate('Products', {
                    collection: 'also-like',
                    title: 'You may also like',
                  })
                }
                style={styles.arrowBtn}
              >
                <Text style={styles.arrowBtnText}>→</Text>
              </Pressable>
            </View>
            <View style={styles.grid3}>
              {alsoLike.map((product) => (
                <View key={product.id} style={styles.gridItem3}>
                  <ProductCard product={product} compact onPress={openProduct} />
                </View>
              ))}
            </View>
          </View>
          <View style={[styles.section, styles.lastBannerWrap]}>
            <Image source={{ uri: CLOSING_BANNER.image }} style={styles.lastBanner} />
            <View style={styles.lastBannerOverlay} pointerEvents="none">
              <Text style={styles.bannerTitle}>{CLOSING_BANNER.title}</Text>
              <Text style={styles.bannerSub}>{CLOSING_BANNER.subtitle}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bannerKicker: {
    color: colors.onAccent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    marginTop: 2,
  },
  bannerTitle: {
    color: colors.onAccent,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  bestCard: {
    marginRight: 12,
  },
  bestTrack: {
    paddingRight: spacing.md,
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
  flashKicker: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  flashSale: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  flashTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  fullBanner: {
    marginTop: spacing.md,
  },
  fullBannerImage: {
    height: 180,
  },
  fullBannerOverlay: {
    backgroundColor: colors.overlay,
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    padding: spacing.md,
    position: 'absolute',
    right: 0,
    top: 0,
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
  arrowBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 36,
  },
  arrowBtnText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  grid3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  gridItem: {
    width: '50%',
  },
  gridItem3: {
    marginBottom: 8,
    paddingHorizontal: 4,
    width: '33.333%',
  },
  heroImage: {
    height: 220,
    width: '100%',
  },
  heroOverlay: {
    alignItems: 'center',
    backgroundColor: colors.overlay,
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  heroSlide: {
    borderRadius: 18,
    height: 220,
    overflow: 'hidden',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  heroTitle: {
    color: colors.onAccent,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  lastBanner: {
    borderRadius: 18,
    height: 160,
    width: '100%',
  },
  lastBannerOverlay: {
    backgroundColor: colors.overlay,
    borderRadius: 18,
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  lastBannerWrap: {
    borderRadius: 18,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  padded: {
    paddingHorizontal: spacing.md,
  },
  saleSoonHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  screenContent: {
    paddingBottom: spacing.xl,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  searchIcon: {
    color: colors.textMuted,
    fontSize: 18,
    marginRight: spacing.sm,
  },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: 15,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  seeAll: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  timerCell: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: spacing.xs,
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  timerLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  timerRow: {
    flexDirection: 'row',
  },
  timerValue: {
    color: colors.text,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
});
