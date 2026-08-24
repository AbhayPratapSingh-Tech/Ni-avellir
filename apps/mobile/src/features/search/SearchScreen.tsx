import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Product } from '@nidavellir/shared';
import { colors, spacing, typography } from '../../theme/tokens';
import { ProductCard } from '../../components/commerce/ProductCard';
import { FloatingCartButton } from '../../components/commerce/FloatingCartButton';
import { Screen } from '../../components/ui/Screen';
import { productRepository, type SearchSuggestions } from '../../services/data/productRepository';
import { useAppDispatch } from '../../app/store';
import { addItem } from '../cart/cartSlice';
import { useToast } from '../../components/ui/Toast';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function SearchScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute();
  const params = (route.params ?? {}) as { q?: string };
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [query, setQuery] = useState(params.q ?? '');
  const [products, setProducts] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestions>({
    queries: [],
    categories: [],
    franchises: [],
  });

  useEffect(() => {
    productRepository.getSearchSuggestions().then(setSuggestions);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setProducts([]);
      return;
    }
    productRepository.list({ search: q, limit: 40 }).then((result) => setProducts(result.items));
  }, [query]);

  const handleAdd = useCallback(
    (product: Product) => {
      dispatch(addItem({ product, quantity: 1 }));
      toast.show('Struck the cart ⚡');
    },
    [dispatch, toast],
  );

  const emptyQuery = !query.trim();

  return (
    <Screen edges={['top']} style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder="Search kits, desks, drops..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          autoFocus
          returnKeyType="search"
        />
      </View>

      {emptyQuery ? (
        <View style={styles.suggestBlock}>
          <Text style={styles.suggestTitle}>Suggested for you</Text>
          <Text style={styles.suggestHint}>Try a tag, team line, or category.</Text>
          <View style={styles.chipWrap}>
            {suggestions.queries.map((item) => (
              <Pressable key={item} style={styles.chip} onPress={() => setQuery(item)}>
                <Text style={styles.chipText}>{item}</Text>
              </Pressable>
            ))}
            {suggestions.franchises.map((item) => (
              <Pressable key={item} style={styles.chip} onPress={() => setQuery(item)}>
                <Text style={styles.chipText}>{item}</Text>
              </Pressable>
            ))}
            {suggestions.categories.map((item) => (
              <Pressable
                key={item}
                style={styles.chip}
                onPress={() => navigation.navigate('Products', { category: item })}
              >
                <Text style={styles.chipText}>{item.replace('-', ' ')}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={styles.item}>
              <ProductCard
                product={item}
                large
                onPress={(product) => navigation.navigate('ProductDetail', { product })}
                onAddToCart={handleAdd}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No matches</Text>
              <Text style={styles.emptySub}>Try another keyword or a suggested search.</Text>
            </View>
          }
        />
      )}
      <FloatingCartButton />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    marginRight: spacing.sm,
    paddingHorizontal: 4,
  },
  backText: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 34,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  empty: {
    paddingVertical: spacing.xl,
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  item: {
    flex: 1,
  },
  list: {
    paddingBottom: 96,
  },
  row: {
    gap: spacing.sm,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  suggestBlock: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.md,
  },
  suggestHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  suggestTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
});
