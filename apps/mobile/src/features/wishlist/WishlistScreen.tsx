import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { removeItem } from './wishlistSlice';
import { addItem } from '../cart/cartSlice';
import { ProductCard } from '../../components/commerce/ProductCard';

export function WishlistScreen() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.wishlist.items);

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>💎</Text>
        <Text style={styles.emptyTitle}>No saved gear yet</Text>
        <Text style={styles.emptySub}>Tap the heart on any product to save it here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Wishlist ({items.length})</Text>
      <View style={styles.grid}>
        {items.map((product) => (
          <View key={product.id} style={styles.item}>
            <ProductCard
              product={product}
              onAddToCart={(p) => {
                dispatch(addItem({ product: p, quantity: 1 }));
                dispatch(removeItem(p.id));
              }}
            />
            <Pressable style={styles.remove} onPress={() => dispatch(removeItem(product.id))}>
              <Text style={styles.removeText}>✕ Remove</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    width: '50%',
  },
  remove: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  removeText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
});
