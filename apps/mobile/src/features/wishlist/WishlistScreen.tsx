import { useCallback } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Product } from '@nidavellir/shared';
import { colors, spacing } from '../../theme/tokens';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { removeItem } from './wishlistSlice';
import { addProductToCart } from '../../lib/cartActions';
import { ProductCard } from '../../components/commerce/ProductCard';
import { FloatingCartButton } from '../../components/commerce/FloatingCartButton';
import { Screen } from '../../components/ui/Screen';
import { useToast } from '../../components/ui/Toast';
import { isLoggedInUser, requireLogin } from '../../lib/authGates';
import { goBackOrHome } from '../../lib/navigation';
import { normalizeProduct } from '../../lib/productMedia';
import { appConfig } from '../../config/appConfig';
import { wishlistRepository } from '../../services/data/wishlistRepository';
import type { RootStackParamList } from '../../app/navigation/types';

export function WishlistScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const user = useAppSelector((state) => state.auth.user);
  const items = useAppSelector((state) => state.wishlist.items.map(normalizeProduct));
  const { width: screenWidth } = useWindowDimensions();
  const itemWidth = (screenWidth - spacing.md * 2 - spacing.sm) / 2;

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedInUser(user)) {
        requireLogin({ user, dispatch, toast, reason: 'wishlist' });
        goBackOrHome(navigation);
        return;
      }
      if (appConfig.dataSource === 'api') {
        void wishlistRepository.syncToStore();
      }
    }, [dispatch, navigation, toast, user]),
  );

  const handleAdd = (product: Product) => {
    void addProductToCart({ product, dispatch, toast }).then((ok) => {
      if (!ok) return;
      dispatch(removeItem(product.id));
      toast.show('Struck the cart ⚡');
    });
  };

  if (!isLoggedInUser(user)) {
    return (
      <Screen style={styles.empty}>
        <Text style={styles.emptyEmoji}>♡</Text>
        <Text style={styles.emptyTitle}>Login to view wishlist</Text>
        <Text style={styles.emptySub}>Save gear after you sign in.</Text>
      </Screen>
    );
  }

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
