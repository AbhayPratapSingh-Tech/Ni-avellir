import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Product } from '@nidavellir/shared';
import { colors, spacing } from '../../theme/tokens';
import { ProductCard } from '../../components/commerce/ProductCard';
import { CatalogEmptyState } from '../../components/commerce/CatalogEmptyState';
import { FloatingCartButton } from '../../components/commerce/FloatingCartButton';
import { Screen } from '../../components/ui/Screen';
import { productRepository } from '../../services/data/productRepository';
import { useAppDispatch } from '../../app/store';
import { addProductToCart } from '../../lib/cartActions';
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
    collection?: 'bestsellers' | 'deals' | 'also-like' | 'restocking';
    title?: string;
    q?: string;
  };
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [sort, setSort] = useState<SortValue>('newest');
  const [sortOpen, setSortOpen] = useState(false);
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
      void addProductToCart({ product, dispatch, toast }).then((ok) => {
        if (ok) toast.show('Struck the cart ⚡');
      });
    },
    [dispatch, toast],
  );

  const allOutOfStock = products.length > 0 && products.every((item) => item.stock === 0);
  const empty = products.length === 0;
  const emptyVariant =
    collection === 'restocking' || allOutOfStock
      ? products.length === 0
        ? 'restocking'
        : 'out-of-stock'
      : 'no-results';

  return (
    <Screen edges={[]} style={styles.screen}>
      <View style={styles.toolbar}>
        <Text style={styles.count}>{products.length} products</Text>
        <Pressable style={styles.searchLink} onPress={() => navigation.navigate('Search', {})} hitSlop={8}>
          <Text style={styles.searchLinkText}>⌕ Search</Text>
        </Pressable>
      </View>

      {!collection && !franchise ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
          contentContainerStyle={styles.catScrollContent}
        >
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

      <View style={styles.sortBlock}>
        <Pressable style={styles.sortToggle} onPress={() => setSortOpen((o) => !o)}>
          <Text style={styles.sortToggleLabel}>Sort</Text>
          <Text style={styles.sortToggleValue}>{SORT_LABELS[sort]}</Text>
          <Text style={styles.sortToggleChevron}>{sortOpen ? '˄' : '˅'}</Text>
        </Pressable>

        {sortOpen ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortDropdown}
          >
            {SORTS.map((value) => (
              <Pressable
                key={value}
                style={[styles.sortChip, sort === value && styles.sortChipActive]}
                onPress={() => {
                  setSort(value);
                  setSortOpen(false);
                }}
              >
                <Text style={[styles.sortChipText, sort === value && styles.sortChipTextActive]}>
                  {SORT_LABELS[value]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {empty || allOutOfStock ? (
        <CatalogEmptyState variant={emptyVariant} />
      ) : (
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
        />
      )}
      <FloatingCartButton />
    </Screen>
  );
}

const styles = StyleSheet.create({
  catChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  catChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  catChipText: {
    color: colors.textMuted,
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 16,
    textTransform: 'capitalize',
  },
  catChipTextActive: {
    color: colors.onAccent,
    fontWeight: '700',
  },
  catScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: spacing.sm,
    minHeight: 40,
  },
  catScrollContent: {
    alignItems: 'center',
    minHeight: 40,
    paddingVertical: 4,
  },
  clearFilter: {
    color: colors.text,
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
  sortBlock: {
    marginBottom: spacing.sm,
  },
  sortToggle: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  sortToggleLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  sortToggleValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: spacing.sm,
    flex: 1,
    textAlign: 'left',
  },
  sortToggleChevron: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginLeft: spacing.sm,
  },
  sortDropdown: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
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
    color: colors.text,
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
