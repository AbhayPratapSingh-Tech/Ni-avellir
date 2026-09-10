import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product } from '@nidavellir/shared';
import { getBundleDisplayHint, resolveProductBundleTag } from '@nidavellir/shared';
import { colors, spacing } from '../../theme/tokens';
import { productRepository } from '../../services/data/productRepository';
import { CachedImage } from '../ui/CachedImage';
import { PriceRow } from './PriceRow';

type Props = {
  product: Product;
  onPressProduct: (product: Product) => void;
  onCompleteBundle: (products: Product[]) => void;
  completing?: boolean;
};

export function BundleCompleteSection({
  product,
  onPressProduct,
  onCompleteBundle,
  completing,
}: Props) {
  const tag = resolveProductBundleTag(product);
  const hint = getBundleDisplayHint(tag);
  const [members, setMembers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(Boolean(tag));

  useEffect(() => {
    if (!tag) {
      setMembers([]);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    void productRepository.getByBundleTag(tag).then((items) => {
      if (!alive) return;
      const ordered = [...items].sort((a, b) => Number(b.isBundleMain) - Number(a.isBundleMain));
      setMembers(ordered);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [tag, product.id]);

  if (!tag) return null;

  const inStockMembers = members.filter((p) => p.stock > 0);
  const total = inStockMembers.reduce((sum, p) => sum + p.price, 0);
  const title = hint?.name ?? `${product.franchise} Bundle`;
  const subtitle = hint?.subtitle ?? `${members.length || '…'}-piece set`;

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Bundle · {tag}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{subtitle}</Text>

      {loading ? (
        <ActivityIndicator color={colors.text} style={styles.spinner} />
      ) : (
        members.map((item) => (
          <Pressable key={item.id} style={styles.row} onPress={() => onPressProduct(item)}>
            <CachedImage uri={item.imageUrl} style={styles.thumb} />
            <View style={styles.meta}>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
                {item.isBundleMain ? ' · Main' : ''}
              </Text>
              <PriceRow product={item} size="card" />
              <Text style={item.stock > 0 ? styles.inStock : styles.out}>
                {item.stock > 0 ? 'In stock' : 'Sold out'}
              </Text>
            </View>
          </Pressable>
        ))
      )}

      <Pressable
        style={[styles.cta, (completing || inStockMembers.length === 0) && styles.ctaDisabled]}
        disabled={completing || inStockMembers.length === 0}
        onPress={() => onCompleteBundle(inStockMembers)}
      >
        <Text style={styles.ctaText}>
          {completing
            ? 'Adding bundle…'
            : inStockMembers.length === 0
              ? 'Bundle unavailable'
              : `Complete the bundle · ₹${total.toLocaleString('en-IN')}`}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
    marginTop: spacing.md,
    paddingVertical: 14,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    color: colors.onAccent,
    fontSize: 14,
    fontWeight: '800',
  },
  inStock: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  kicker: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  meta: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  out: {
    color: '#c45c5c',
    fontSize: 11,
    marginTop: 2,
  },
  row: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  spinner: {
    marginVertical: spacing.md,
  },
  sub: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.xs,
    marginTop: 2,
  },
  thumb: {
    backgroundColor: colors.background,
    borderRadius: 10,
    height: 64,
    width: 64,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },
});
