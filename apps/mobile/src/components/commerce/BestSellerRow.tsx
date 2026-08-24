import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product } from '@nidavellir/shared';
import { colors, spacing } from '../../theme/tokens';
import { getProductImages } from '../../lib/productMedia';
import { StarRating } from '../ui/StarRating';
import { PriceRow } from './PriceRow';

type Props = {
  product: Product;
  onPress: (product: Product) => void;
};

export function BestSellerRow({ product, onPress }: Props) {
  const image = getProductImages(product)[0];
  return (
    <Pressable style={styles.row} onPress={() => onPress(product)}>
      <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.rating}>
          <StarRating rating={product.rating} size={12} />
          <Text style={styles.count}>({product.reviewCount})</Text>
        </View>
        <PriceRow product={product} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  count: {
    color: colors.textMuted,
    fontSize: 11,
    marginLeft: 4,
  },
  image: {
    backgroundColor: colors.background,
    borderRadius: 10,
    height: 92,
    width: 92,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  rating: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 4,
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
});
