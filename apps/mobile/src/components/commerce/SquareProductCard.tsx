import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product } from '@nidavellir/shared';
import { colors } from '../../theme/tokens';
import { getProductImages } from '../../lib/productMedia';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { toggleItem } from '../../features/wishlist/wishlistSlice';
import { addItem } from '../../features/cart/cartSlice';
import { useToast } from '../ui/Toast';
import { StarRating } from '../ui/StarRating';
import { PriceRow } from './PriceRow';

type Props = {
  product: Product;
  onPress: (product: Product) => void;
};

export function SquareProductCard({ product, onPress }: Props) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const wishlisted = useAppSelector((state) => state.wishlist.items.some((item) => item.id === product.id));
  const image = getProductImages(product)[0];
  const inStock = product.stock > 0;

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Pressable onPress={() => onPress(product)}>
          <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        </Pressable>
        <View style={styles.actions}>
          <Pressable
            style={styles.chip}
            onPress={() => {
              dispatch(toggleItem(product));
              toast.show(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
            }}
            hitSlop={8}
          >
            <Text style={[styles.chipText, wishlisted && styles.heartOn]}>{wishlisted ? '♥' : '♡'}</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, !inStock && styles.chipDisabled]}
            disabled={!inStock}
            onPress={() => {
              if (!inStock) return;
              dispatch(addItem({ product, quantity: 1 }));
              toast.show('Struck the cart ⚡');
            }}
            hitSlop={8}
          >
            <Text style={styles.chipText}>🛒</Text>
          </Pressable>
        </View>
      </View>
      <Pressable style={styles.info} onPress={() => onPress(product)}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.rating}>
          <StarRating rating={product.rating} size={11} />
          <Text style={styles.count}>{product.rating.toFixed(1)}</Text>
        </View>
        <PriceRow product={product} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    position: 'absolute',
    right: 8,
    top: 8,
    zIndex: 6,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    width: 168,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    marginBottom: 6,
    width: 28,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
  },
  count: {
    color: colors.textMuted,
    fontSize: 11,
    marginLeft: 4,
  },
  heartOn: {
    color: colors.danger,
  },
  image: {
    height: 168,
    width: 168,
  },
  imageWrap: {
    backgroundColor: colors.background,
  },
  info: {
    padding: 12,
  },
  name: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    minHeight: 34,
  },
  rating: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
    marginTop: 4,
  },
});
