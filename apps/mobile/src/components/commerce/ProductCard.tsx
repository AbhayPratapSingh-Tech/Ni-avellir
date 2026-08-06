import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product } from '@nidavellir/shared';
import { colors, spacing, typography } from '../../theme/tokens';

type Props = {
  product: Product;
  onPress?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
};

export function ProductCard({ product, onPress, onAddToCart }: Props) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => onPress?.(product)}
      accessibilityLabel={product.name}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
        {product.isLimitedDrop ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Limited</Text>
          </View>
        ) : null}
        {!product.stock ? (
          <View style={styles.soldOut}>
            <Text style={styles.soldOutText}>Sold out</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.info}>
        <Text style={styles.franchise} numberOfLines={1}>
          {product.franchise}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.row}>
          <Text style={styles.price}>₹{product.price.toLocaleString('en-IN')}</Text>
          <Text style={styles.rating}>★ {product.rating}</Text>
        </View>
        {onAddToCart && product.stock > 0 ? (
          <Pressable style={styles.addBtn} onPress={() => onAddToCart(product)}>
            <Text style={styles.addBtnText}>Add to cart</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    marginTop: spacing.sm,
    paddingVertical: 8,
  },
  addBtnText: {
    color: '#07130D',
    fontSize: typography.caption,
    fontWeight: '800',
    textAlign: 'center',
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
    color: '#07130D',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    flex: 1,
    margin: spacing.xs,
    overflow: 'hidden',
  },
  franchise: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  image: {
    height: 150,
    width: '100%',
  },
  imageWrap: {
    backgroundColor: '#0D0F16',
  },
  info: {
    padding: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
    marginTop: 2,
    minHeight: 40,
  },
  price: {
    color: colors.accent,
    fontSize: typography.body,
    fontWeight: '800',
  },
  rating: {
    color: colors.textMuted,
    fontSize: 12,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  soldOut: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(9,10,15,0.7)',
    justifyContent: 'center',
  },
  soldOutText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
});
