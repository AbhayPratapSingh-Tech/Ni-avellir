import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Product } from '@nidavellir/shared';
import { colors, spacing } from '../../theme/tokens';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { removeItem } from './wishlistSlice';
import { addItem } from '../cart/cartSlice';
import { ProductCard } from '../../components/commerce/ProductCard';
import { FloatingCartButton } from '../../components/commerce/FloatingCartButton';
import { Screen } from '../../components/ui/Screen';
import { useToast } from '../../components/ui/Toast';
import { normalizeProduct } from '../../lib/productMedia';
import type { RootStackParamList } from '../../app/navigation/types';

export function WishlistScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const items = useAppSelector((state) => state.wishlist.items.map(normalizeProduct));
  const { width: screenWidth } = useWindowDimensions();
  // Keep one card the same width as a cell in a 2-column grid.
  const itemWidth = (screenWidth - spacing.md * 2 - spacing.sm) / 2;

  const handleAdd = (product: Product) => {
    dispatch(addItem({ product, quantity: 1 }));
    dispatch(removeItem(product.id));
    toast.show('Struck the cart ⚡');
  };

  if (items.length === 0) {
    return (
      <Screen style={styles.empty}>
        <Text style={styles.emptyEmoji}>♡</Text>
        <Text style={styles.emptyTitle}>No saved gear yet</Text>
        <Text style={styles.emptySub}>Tap the heart on any product to save it here.</Text>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={{ width: itemWidth }}>
            <ProductCard
              product={item}
              large
              onPress={(product) => navigation.navigate('ProductDetail', { product })}
              onAddToCart={handleAdd}
            />
          </View>
        )}
      />
      <FloatingCartButton />
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
    color: colors.danger,
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  list: {
    paddingBottom: 96,
  },
  row: {
    gap: spacing.sm,
    justifyContent: 'flex-start',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
});
