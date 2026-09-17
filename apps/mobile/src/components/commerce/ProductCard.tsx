import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product } from '@nidavellir/shared';
import { colors, spacing } from '../../theme/tokens';
import { discountPercent, formatInr, getProductImages } from '../../lib/productMedia';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { addProductToCart } from '../../lib/cartActions';
import { toggleWishlistForUser } from '../../lib/wishlistActions';
import { StarRating } from '../ui/StarRating';
import { CachedImage } from '../ui/CachedImage';
import { useToast } from '../ui/Toast';
import { ImagePager } from './ImagePager';

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
  // Portrait media for 2-col retail; slightly shorter for Home 3-col compact.
  const aspect = compact ? 1.05 : large ? 1.25 : 1.2;
  const fallback = compact ? 96 : large ? 190 : 160;
  const imageHeight = width > 0 ? Math.round(width * aspect) : fallback;
  const dispatch = useAppDispatch();
  const toast = useToast();
  const user = useAppSelector((state) => state.auth.user);
  const wishlisted = useAppSelector((state) => state.wishlist.items.some((item) => item.id === product.id));
  const inStock = product.stock > 0;
  const off = discountPercent(product);

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
    <View style={[styles.card, compact && styles.cardCompact, !compact && styles.cardRetail]}>
      <View
        style={[styles.imageWrap, !compact && styles.imageWrapRetail]}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        {width > 0 ? (
          compact ? (
            <Pressable onPress={() => onPress?.(product)}>
              <CachedImage uri={images[0]} style={{ height: imageHeight, width }} />
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
        <Pressable style={styles.wishChip} onPress={handleWish} hitSlop={8}>
          <Text style={[styles.wishGlyph, wishlisted && styles.heartOn]}>{wishlisted ? '♥' : '♡'}</Text>
        </Pressable>
        <Pressable
          style={[styles.cartChip, !inStock && styles.chipDisabled]}
          onPress={handleAdd}
          hitSlop={8}
          disabled={!inStock}
        >
          <Text style={styles.cartGlyph}>+</Text>
        </Pressable>
        {product.isLimitedDrop ? (
          <View style={styles.limitedBadge} pointerEvents="none">
            <Text style={styles.limitedText}>Limited</Text>
          </View>
        ) : null}
        {!inStock ? (
          <View style={styles.soldOut} pointerEvents="none">
            <Text style={styles.soldOutText}>Sold out</Text>
          </View>
        ) : null}
      </View>
      <Pressable style={[styles.info, compact && styles.infoCompact]} onPress={() => onPress?.(product)}>
        {!compact ? null : (
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand}
          </Text>
        )}
        <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={2}>
          {product.name}
        </Text>
        {compact ? (
          <View style={styles.ratingRowCompact}>
            <StarRating rating={product.rating} size={10} />
            <Text style={styles.ratingCount}>{product.rating.toFixed(1)}</Text>
          </View>
        ) : null}
        <View style={styles.priceBlock}>
          {off > 0 ? (
            <View style={styles.saveChip}>
              <Text style={styles.saveText}>Save {off}%</Text>
            </View>
          ) : null}
          <Text style={[styles.price, compact && styles.priceCompact]}>{formatInr(product.price)}</Text>
        </View>
        {product.compareAtPrice > product.price ? (
          <Text style={styles.mrp}>{formatInr(product.compareAtPrice)}</Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.surface,
    flex: 1,
    margin: 6,
    overflow: 'hidden',
  },
  cardCompact: {
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    margin: 0,
  },
  cardRetail: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginHorizontal: 6,
    marginVertical: 8,
  },
  cartChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 28,
    zIndex: 6,
  },
  cartGlyph: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  chipDisabled: {
    opacity: 0.4,
  },
  heartOn: {
    color: colors.danger,
  },
  imageWrap: {
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  imageWrapRetail: {
    backgroundColor: '#F0F1F3',
    borderRadius: 14,
  },
  info: {
    paddingHorizontal: 4,
    paddingTop: 10,
  },
  infoCompact: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  limitedBadge: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    bottom: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: 'absolute',
  },
  limitedText: {
    color: colors.onAccent,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  mrp: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    textDecorationLine: 'line-through',
  },
  name: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    minHeight: 36,
    textAlign: 'left',
  },
  nameCompact: {
    fontSize: 11,
    lineHeight: 14,
    minHeight: 28,
  },
  price: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '800',
  },
  priceBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  priceCompact: {
    color: colors.text,
    fontSize: 13,
  },
  ratingCount: {
    color: colors.textMuted,
    fontSize: 11,
    marginLeft: 4,
  },
  ratingRowCompact: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 2,
    marginTop: 2,
  },
  saveChip: {
    backgroundColor: colors.accent,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  saveText: {
    color: colors.onAccent,
    fontSize: 10,
    fontWeight: '800',
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
  wishChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    left: 8,
    position: 'absolute',
    top: 8,
    width: 28,
    zIndex: 6,
  },
  wishGlyph: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
