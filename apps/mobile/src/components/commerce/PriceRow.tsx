import { StyleSheet, Text, View } from 'react-native';
import type { Product } from '@nidavellir/shared';
import { colors, typography } from '../../theme/tokens';
import { discountPercent, formatInr } from '../../lib/productMedia';

type Props = {
  product: Product;
  size?: 'card' | 'detail';
};

export function PriceRow({ product, size = 'card' }: Props) {
  const off = discountPercent(product);
  const priceStyle = size === 'detail' ? styles.priceDetail : styles.price;
  return (
    <View style={styles.row}>
      <Text style={priceStyle}>{formatInr(product.price)}</Text>
      {product.compareAtPrice > product.price ? (
        <Text style={size === 'detail' ? styles.mrpDetail : styles.mrp}>
          {formatInr(product.compareAtPrice)}
        </Text>
      ) : null}
      {off > 0 ? (
        <View style={size === 'detail' ? styles.offBox : undefined}>
          <Text style={size === 'detail' ? styles.offBoxText : styles.off}>{off}% off</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mrp: {
    color: colors.textMuted,
    fontSize: 12,
    marginLeft: 6,
    textDecorationLine: 'line-through',
  },
  mrpDetail: {
    color: colors.textMuted,
    fontSize: 14,
    marginLeft: 8,
    textDecorationLine: 'line-through',
  },
  off: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  offBox: {
    backgroundColor: colors.danger,
    borderRadius: 6,
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  offBoxText: {
    color: colors.onAccent,
    fontSize: 12,
    fontWeight: '800',
  },
  price: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  priceDetail: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
