import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Product } from '@nidavellir/shared';
import { colors, spacing, typography } from '../../theme/tokens';
import { ProductCard } from '../../components/commerce/ProductCard';
import { productRepository } from '../../services/data/productRepository';
import { useAppDispatch } from '../../app/store';
import { addItem } from '../cart/cartSlice';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const SORTS = ['newest', 'rating', 'price_asc', 'price_desc'] as const;
type SortValue = (typeof SORTS)[number];

export function ProductsScreen() {
  const navigation = useNavigation<Navigation>();
  const dispatch = useAppDispatch();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortValue>('newest');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    productRepository.getCategories().then(setCategories);
  }, []);

  const load = useCallback(async () => {
    const result = await productRepository.list({
      search: search || undefined,
      sort,
      category,
    });
    setProducts(result.items);
  }, [search, sort, category]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = useCallback(
    (product: Product) => dispatch(addItem({ product, quantity: 1 })),
    [dispatch],
  );

  return (
    <View style={styles.screen}>
      <TextInput
        style={styles.search}
        placeholder="Search the forge..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.sortRow}>
        {SORTS.map((s) => (
          <Pressable
            key={s}
            style={[styles.sortChip, sort === s && styles.sortChipActive]}
            onPress={() => setSort(s)}
          >
            <Text
              style={[styles.sortChipText, sort === s && styles.sortChipTextActive]}
              numberOfLines={1}
            >
              {s.replace('_', ' ')}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <ProductCard
              product={item}
              onPress={(p) => navigation.navigate('ProductDetail', { product: p })}
              onAddToCart={handleAdd}
            />
          </View>
        )}
        ListHeaderComponent={
          categories.length > 1 ? (
            <View style={styles.catRow}>
              <Pressable
                style={[styles.catChip, !category && styles.catChipActive]}
                onPress={() => setCategory(undefined)}
              >
                <Text
                  style={[styles.catChipText, !category && styles.catChipTextActive]}
                >
                  All
                </Text>
              </Pressable>
              {categories.map((cat) => (
                <Pressable
                  key={cat}
                  style={[styles.catChip, category === cat && styles.catChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[styles.catChipText, category === cat && styles.catChipTextActive]}
                  >
                    {cat.replace('-', ' ')}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  catChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  catChipActive: {
    borderColor: colors.accent,
  },
  catChipText: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  catChipTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  catRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  item: {
    flex: 1,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  row: {
    gap: 0,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.md,
  },
  search: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  sortChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortChipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(46,242,167,0.12)',
  },
  sortChipText: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  sortChipTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  sortRow: {
    flexDirection: 'row',
    marginVertical: spacing.sm,
  },
});
