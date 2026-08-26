import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/tokens';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { removeItem } from './wishlistSlice';
import { addItem } from '../cart/cartSlice';
import { ProductCard } from '../../components/commerce/ProductCard';
import { Screen } from '../../components/ui/Screen';
import { useToast } from '../../components/ui/Toast';
import type { RootStackParamList } from '../../app/navigation/types';

export function WishlistScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const items = useAppSelector((state) => state.wishlist.items);

  if (items.length === 0) {
    return (
      <Screen style={styles.empty}>
        <Text style={styles.emptyEmoji}>💎</Text>
        <Text style={styles.emptyTitle}>No saved gear yet</Text>
        <Text style={styles.emptySub}>Tap the heart on any product to save it here.</Text>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.grid}>
        {items.map((product) => (
          <View key={product.id} style={styles.item}>
            <ProductCard
              product={product}
              onPress={(p) => navigation.navigate('ProductDetail', { product: p })}
              onAddToCart={(p) => {
                dispatch(addItem({ product: p, quantity: 1 }));
                dispatch(removeItem(p.id));
                toast.show('Struck the cart ⚡');
              }}
            />
            <Pressable
              style={styles.remove}
              onPress={() => {
                dispatch(removeItem(product.id));
                toast.show('Removed from wishlist');
              }}
            >
              <Text style={styles.removeText}>✕ Remove</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </Screen>
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
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.md,
  },
});
