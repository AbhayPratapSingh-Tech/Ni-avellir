import { ScrollView, Image, StyleSheet, Text, Pressable, View } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../theme/tokens';
import { useAppDispatch } from '../../app/store';
import { addItem } from '../cart/cartSlice';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ProductDetail'>;

export function ProductDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const dispatch = useAppDispatch();
  const { product } = route.params;

  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 300 });
    opacity.value = withTiming(1, { duration: 300 });
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <ScrollView style={styles.screen}>
      <Animated.View style={[styles.hero, animatedStyle]}>
        <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
        {product.isLimitedDrop ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Limited Drop</Text>
          </View>
        ) : null}
      </Animated.View>

      <View style={styles.body}>
        <Text style={styles.franchise}>{product.franchise}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.price}>₹{product.price.toLocaleString('en-IN')}</Text>
          <Text style={styles.rating}>★ {product.rating} ({product.reviewCount})</Text>
        </View>
        {product.stock > 0 ? (
          <Text style={styles.stock}>In stock · {product.stock} left</Text>
        ) : (
          <Text style={styles.outOfStock}>Sold out</Text>
        )}

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.tags}>
          {product.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={[styles.addBtn, product.stock === 0 && styles.addBtnDisabled]}
          disabled={product.stock === 0}
onPress={() => {
            dispatch(addItem({ product, quantity: 1 }));
            navigation.goBack();
          }}
        >
          <Text style={styles.addBtnText}>
            {product.stock > 0 ? 'Add to cart' : 'Out of stock'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    marginTop: spacing.lg,
    paddingVertical: 14,
  },
  addBtnDisabled: {
    backgroundColor: colors.border,
  },
  addBtnText: {
    color: '#07130D',
    fontSize: typography.body,
    fontWeight: '800',
    textAlign: 'center',
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    left: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
    top: spacing.md,
  },
  badgeText: {
    color: '#07130D',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  body: {
    padding: spacing.lg,
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
  },
  franchise: {
    color: colors.accent,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  hero: {
    backgroundColor: '#0D0F16',
  },
  image: {
    height: 320,
    width: '100%',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  name: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    marginTop: 4,
  },
  outOfStock: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  price: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: '800',
  },
  rating: {
    color: colors.textMuted,
    fontSize: 14,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.lg,
  },
  stock: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  tag: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
});
