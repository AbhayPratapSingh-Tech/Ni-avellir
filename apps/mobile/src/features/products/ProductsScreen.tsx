import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Product } from '@nidavellir/shared';
import { colors, spacing } from '../../theme/tokens';
import { ProductCard } from '../../components/commerce/ProductCard';
import { FloatingCartButton } from '../../components/commerce/FloatingCartButton';
import { Screen } from '../../components/ui/Screen';
import { productRepository } from '../../services/data/productRepository';
import { useAppDispatch } from '../../app/store';
import { addItem } from '../cart/cartSlice';
import { useToast } from '../../components/ui/Toast';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const SORTS = ['newest', 'rating', 'price_asc', 'price_desc'] as const;
type SortValue = (typeof SORTS)[number];

const SORT_LABELS: Record<SortValue, string> = {
  newest: 'New',
  rating: 'Top rated',
  price_asc: 'Price ↑',
  price_desc: 'Price ↓',
};

export function ProductsScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute();
  const params = (route.params ?? {}) as {
    category?: string;
    franchise?: string;
    collection?: 'bestsellers' | 'deals' | 'also-like';
    title?: string;
    q?: string;
  };
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [sort, setSort] = useState<SortValue>('newest');
  const [category, setCategory] = useState<string | undefined>(params.category);
  const [franchise, setFranchise] = useState<string | undefined>(params.franchise);
  const [search, setSearch] = useState(params.q);
  const [collection, setCollection] = useState(params.collection);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    setSearch(params.q);
    setCollection(params.collection);
    if (params.franchise) {
      setFranchise(params.franchise);
      setCategory(undefined);
    } else {
      setFranchise(undefined);
      setCategory(params.category);
    }
  }, [params.category, params.franchise, params.q, params.collection]);

  useEffect(() => {
    productRepository.getCategories().then(setCategories);
  }, []);

  const load = useCallback(async () => {
    const result = await productRepository.list({
      sort,
      category,
      franchise,
      search,
      collection,
    });
    setProducts(result.items);
  }, [sort, category, franchise, search, collection]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = useCallback(
    (product: Product) => {
      dispatch(addItem({ product, quantity: 1 }));
      toast.show('Struck the cart ⚡');
    },
    [dispatch, toast],
  );

  return (
    <Screen edges={[]} style={styles.screen}>
      <View style={styles.toolbar}>
        <Text style={styles.count}>{products.length} products</Text>
        <Pressable style={styles.searchLink} onPress={() => navigation.navigate('Search', {})} hitSlop={8}>
          <Text style={styles.searchLinkText}>⌕ Search</Text>
        </Pressable>
      </View>

      {!collection && !franchise ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          <Pressable
            style={[styles.catChip, !category && styles.catChipActive]}
            onPress={() => setCategory(undefined)}
          >
            <Text style={[styles.catChipText, !category && styles.catChipTextActive]}>All</Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              style={[styles.catChip, category === cat && styles.catChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
                {cat.replace('-', ' ')}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {franchise ? (
        <View style={styles.filterBanner}>
          <Text style={styles.filterBannerText}>Brand filter on</Text>
          <Pressable
            onPress={() => {
              setFranchise(undefined);
              navigation.setParams({ franchise: undefined, title: 'Products' } as never);
            }}
          >
            <Text style={styles.clearFilter}>Clear</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.sortLabel}>Sort by</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SORTS.map((value) => (
            <Pressable
              key={value}
              style={[styles.sortChip, sort === value && styles.sortChipActive]}
              onPress={() => setSort(value)}
            >
              <Text style={[styles.sortChipText, sort === value && styles.sortChipTextActive]}>
                {SORT_LABELS[value]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
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
              large
              onPress={(product) => navigation.navigate('ProductDetail', { product })}
              onAddToCart={handleAdd}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No products</Text>
            <Text style={styles.emptySub}>Try another category or sort.</Text>
          </View>
        }
      />
      <FloatingCartButton />
    </Screen>
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
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  catChipText: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  catChipTextActive: {
    color: colors.onAccent,
    fontWeight: '700',
  },
  catScroll: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  clearFilter: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  count: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
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
  filterBanner: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  filterBannerText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  item: {
    flex: 1,
  },
  list: {
    paddingBottom: 96,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.sm,
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
  searchLink: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchLinkText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  sortChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginLeft: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sortChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  sortChipText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  sortChipTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  sortLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
});
