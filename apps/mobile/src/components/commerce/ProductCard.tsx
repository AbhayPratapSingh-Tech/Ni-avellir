import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product } from '@nidavellir/shared';
import { colors, spacing } from '../../theme/tokens';
import { getProductImages } from '../../lib/productMedia';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { addProductToCart } from '../../lib/cartActions';
import { toggleWishlistForUser } from '../../lib/wishlistActions';
import { StarRating } from '../ui/StarRating';
import { useToast } from '../ui/Toast';
import { ImagePager } from './ImagePager';
import { PriceRow } from './PriceRow';

type Props = {
  product: Product;
  compact?: boolean;
  large?: boolean;
  onPress?: (product: Product) => void;
  /** Optional override; default adds to cart + toast. */
  onAddToCart?: (product: Product) => void;
};

export function ProductCard({ product, compact, large, onPress, onAddToCart }: Props) {
  const [width, setWidth] = useState(0);
  const images = getProductImages(product);
  const imageHeight = compact ? 118 : large ? 210 : 150;
  const dispatch = useAppDispatch();
  const toast = useToast();
  const user = useAppSelector((state) => state.auth.user);
  const wishlisted = useAppSelector((state) => state.wishlist.items.some((item) => item.id === product.id));
  const inStock = product.stock > 0;

  const handleWish = () => {
    void toggleWishlistForUser({
      product,
      user,
      dispatch,
      toast,
      currentlyWishlisted: wishlisted,
    });
  };

  const handleAdd = () => {
    if (!inStock) {
      toast.show('Out of stock');
      return;
    }
    if (onAddToCart) {
      onAddToCart(product);
      return;
    }
    void addProductToCart({ product, dispatch, toast }).then((ok) => {
      if (ok) toast.show('Struck the cart ⚡');
    });
  };

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View
        style={styles.imageWrap}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        {width > 0 ? (
          compact ? (
            <Pressable onPress={() => onPress?.(product)}>
              <Image
                source={{ uri: images[0] }}
                style={{ height: imageHeight, width }}
                resizeMode="cover"
              />
            </Pressable>
          ) : (
            <ImagePager
              images={images}
              height={imageHeight}
              width={width}
              showCount={false}
              onPressImage={() => onPress?.(product)}
            />
          )
        ) : null}
        <View style={styles.actions}>
          <Pressable style={styles.chip} onPress={handleWish} hitSlop={8}>
            <Text style={[styles.chipText, wishlisted && styles.heartOn]}>{wishlisted ? '♥' : '♡'}</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, !inStock && styles.chipDisabled]}
            onPress={handleAdd}
            hitSlop={8}
            disabled={!inStock}
          >
            <Text style={styles.chipText}>🛒</Text>
          </Pressable>
        </View>
        {product.isLimitedDrop ? (
          <View style={styles.badge} pointerEvents="none">
            <Text style={styles.badgeText}>Limited</Text>
          </View>
        ) : null}
        {!inStock ? (
          <View style={styles.soldOut} pointerEvents="none">
            <Text style={styles.soldOutText}>Sold out</Text>
          </View>
        ) : null}
      </View>
      <Pressable style={styles.info} onPress={() => onPress?.(product)}>
        <Text style={styles.brand} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.ratingRow}>
          <StarRating rating={product.rating} size={12} />
          <Text style={styles.ratingCount}>{product.rating.toFixed(1)}</Text>
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
  badge: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    left: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: 'absolute',
    top: spacing.sm,
  },
  badgeText: {
    color: colors.onAccent,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  brand: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    margin: 6,
    overflow: 'hidden',
  },
  cardCompact: {
    margin: 0,
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
  heartOn: {
    color: colors.danger,
  },
  imageWrap: {
    backgroundColor: colors.background,
    minHeight: 118,
  },
  info: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    minHeight: 36,
  },
  ratingCount: {
    color: colors.textMuted,
    fontSize: 11,
    marginLeft: 4,
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
    marginTop: 4,
  },
  soldOut: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: colors.overlay,
    justifyContent: 'center',
  },
  soldOutText: {
    color: colors.onAccent,
    fontSize: 14,
    fontWeight: '800',
  },
});
