import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogFilterOptions, Product } from '@nidavellir/shared';
import { colors, spacing } from '../../theme/tokens';
import { ProductCard } from '../../components/commerce/ProductCard';
import { CatalogEmptyState } from '../../components/commerce/CatalogEmptyState';
import { Screen } from '../../components/ui/Screen';
import { productRepository } from '../../services/data/productRepository';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { addProductToCart } from '../../lib/cartActions';
import { useToast } from '../../components/ui/Toast';
import type { RootStackParamList } from '../../app/navigation/types';
import {
  DEFAULT_PLP_SORT,
  ProductsFilterModal,
  type PlpFilterDraft,
} from './ProductsFilterModal';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const PAGE_SIZE = 20;

function makeDefaultDraft(
  franchise?: string,
  bounds?: { min: number; max: number },
): PlpFilterDraft {
  return {
    sort: DEFAULT_PLP_SORT,
    minPrice: bounds?.min ?? 0,
    maxPrice: bounds?.max ?? 0,
    franchise,
    minRating: 0,
    inStockOnly: false,
  };
}

export function ProductsScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute();
  const params = (route.params ?? {}) as {
    category?: string;
    tag?: string;
    franchise?: string;
    collection?: 'bestsellers' | 'deals' | 'also-like' | 'restocking' | 'drop-zone' | 'for-you';
    title?: string;
    q?: string;
  };
  const dispatch = useAppDispatch();
  const toast = useToast();
  const recentItems = useAppSelector((state) => state.recent.items);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const [products, setProducts] = useState<Product[]>([]);
  const [filterOptions, setFilterOptions] = useState<CatalogFilterOptions | null>(null);
  const [applied, setApplied] = useState<PlpFilterDraft>(() =>
    makeDefaultDraft(params.franchise),
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState<string | undefined>(params.category);
  const [tag, setTag] = useState<string | undefined>(params.tag);
  const [search, setSearch] = useState(params.q);
  const [collection, setCollection] = useState(params.collection);
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  const showFilters = !collection;

  const catalogMin = filterOptions?.priceMin ?? 0;
  const catalogMax = Math.max(catalogMin, filterOptions?.priceMax ?? 0);

  const priceQuery = useMemo(() => {
    if (!filterOptions || catalogMax <= 0) return {};
    const narrowed =
      applied.minPrice > catalogMin || applied.maxPrice < catalogMax;
    if (!narrowed) return {};
    return {
      minPrice: applied.minPrice,
      maxPrice: applied.maxPrice,
    };
  }, [applied.minPrice, applied.maxPrice, catalogMin, catalogMax, filterOptions]);

  const filtersActive =
    showFilters &&
    (Boolean(priceQuery.minPrice !== undefined || priceQuery.maxPrice !== undefined) ||
      applied.minRating > 0 ||
      applied.inStockOnly ||
      Boolean(applied.franchise) ||
      applied.sort !== DEFAULT_PLP_SORT);

  const sortLabel =
    filterOptions?.sorts.find((s) => s.value === applied.sort)?.label ?? 'Newest';

  useEffect(() => {
    setSearch(params.q);
    setCollection(params.collection);
    setTag(params.tag);
    if (params.franchise) {
      setApplied((prev) => ({ ...prev, franchise: params.franchise }));
    } else {
      setApplied((prev) => ({ ...prev, franchise: undefined }));
    }
    if (params.category) {
      setCategory(params.category);
    } else if (!params.franchise) {
      setCategory(undefined);
    }
  }, [params.category, params.tag, params.franchise, params.q, params.collection]);

  useEffect(() => {
    productRepository.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (!showFilters) return;
    let cancelled = false;
    productRepository
      .getFilterOptions()
      .then((options) => {
        if (cancelled) return;
        setFilterOptions(options);
        setCategories((prev) => (prev.length ? prev : options.categories));
        const min = options.priceMin ?? 0;
        const max = Math.max(min, options.priceMax ?? 0);
        setApplied((prev) => {
          const unset = prev.maxPrice === 0 && prev.minPrice === 0;
          const wasFullRange =
            unset ||
            (filterOptions != null &&
              prev.minPrice === filterOptions.priceMin &&
              prev.maxPrice === filterOptions.priceMax);
          return {
            ...prev,
            minPrice: wasFullRange ? min : Math.min(Math.max(prev.minPrice, min), max),
            maxPrice: wasFullRange ? max : Math.min(Math.max(prev.maxPrice, min), max),
            minRating: options.ratings.some((r) => r.value === prev.minRating)
              ? prev.minRating
              : 0,
          };
        });
      })
      .catch((error) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[PLP] getFilterOptions failed', error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [showFilters]);

  const clearFilters = useCallback(() => {
    const next = makeDefaultDraft(undefined, { min: catalogMin, max: catalogMax });
    setApplied(next);
    navigation.setParams({ franchise: undefined, title: 'Products' } as never);
    setModalOpen(false);
  }, [navigation, catalogMin, catalogMax]);

  const applyFilters = useCallback(
    (next: PlpFilterDraft) => {
      setApplied(next);
      if (next.franchise) {
        navigation.setParams({
          franchise: next.franchise,
          title: `${next.franchise}'s Vault`,
        } as never);
      } else {
        navigation.setParams({ franchise: undefined, title: 'Products' } as never);
      }
    },
    [navigation],
  );

  const loadPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      if (!replace) {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setInitialLoading(true);
      }

      try {
        if (collection === 'for-you') {
          const recentIds = recentItems.map((item) => item.id).slice(0, 12);
          const signalProducts = [...recentItems, ...wishlistItems].filter(
            (item, index, all) => all.findIndex((row) => row.id === item.id) === index,
          );
          const items = await productRepository.getForYou({
            recentIds,
            signalProducts,
            limit: PAGE_SIZE,
            refresh: replace,
          });
          setPage(1);
          setPages(1);
          setTotal(items.length);
          setProducts(items);
        } else {
          const query = {
            sort: applied.sort,
            category,
            tag,
            franchise: applied.franchise,
            search,
            collection,
            page: pageToLoad,
            limit: PAGE_SIZE,
            ...(showFilters
              ? {
                  ...priceQuery,
                  minRating: applied.minRating > 0 ? applied.minRating : undefined,
                  inStockOnly: applied.inStockOnly || undefined,
                }
              : {}),
          };
          const result = await productRepository.list(query);
          setPage(result.page);
          setPages(result.pages);
          setTotal(result.total);
          setProducts((prev) => {
            if (replace) return result.items;
            const seen = new Set(prev.map((p) => p.id));
            return [...prev, ...result.items.filter((p) => !seen.has(p.id))];
          });
        }
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    },
    [
      applied.sort,
      applied.franchise,
      applied.minRating,
      applied.inStockOnly,
      category,
      tag,
      search,
      collection,
      recentItems,
      wishlistItems,
      showFilters,
      priceQuery,
    ],
  );

  useEffect(() => {
    setProducts([]);
    setPage(1);
    setPages(1);
    setTotal(0);
    void loadPage(1, true);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (initialLoading || loadingMoreRef.current) return;
    if (page >= pages) return;
    void loadPage(page + 1, false);
  }, [initialLoading, loadPage, page, pages]);

  const handleAdd = useCallback(
    (product: Product) => {
      void addProductToCart({ product, dispatch, toast }).then((ok) => {
        if (ok) toast.show('Struck the cart ⚡');
      });
    },
    [dispatch, toast],
  );

  const allOutOfStock = products.length > 0 && products.every((item) => item.stock === 0);
  const empty = !initialLoading && products.length === 0;
  const emptyVariant =
    collection === 'restocking' || allOutOfStock
      ? products.length === 0
        ? 'restocking'
        : 'out-of-stock'
      : 'no-results';

  return (
    <Screen edges={[]} style={styles.screen}>
      <View style={styles.toolbar}>
        <Text style={styles.count}>
          {initialLoading
            ? 'Loading…'
            : total > 0
              ? `${products.length} of ${total} products`
              : `${products.length} products`}
        </Text>
        <Pressable style={styles.searchLink} onPress={() => navigation.navigate('Search', {})} hitSlop={8}>
          <Text style={styles.searchLinkText}>⌕ Search</Text>
        </Pressable>
      </View>

      {!collection ? (
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

      {showFilters ? (
        <Pressable
          style={[styles.sortFilterBtn, filtersActive && styles.sortFilterBtnActive]}
          onPress={() => setModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Sort and filter"
        >
          <View style={styles.sortFilterCopy}>
            <Text style={styles.sortFilterLabel}>Filters</Text>
            <Text style={styles.sortFilterValue} numberOfLines={1}>
              {filtersActive
                ? `${sortLabel}${applied.franchise ? ` · ${applied.franchise}` : ''}${
                    applied.inStockOnly ? ' · In stock' : ''
                  }`
                : sortLabel}
            </Text>
          </View>
          <Text style={styles.sortFilterChevron}>›</Text>
        </Pressable>
      ) : null}

      {initialLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : empty || allOutOfStock ? (
        <View style={styles.emptyWrap}>
          {filtersActive && empty ? (
            <Pressable style={styles.clearFiltersBtn} onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </Pressable>
          ) : null}
          <CatalogEmptyState variant={emptyVariant} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          removeClippedSubviews
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.text} />
              </View>
            ) : page >= pages && products.length > 0 ? (
              <Text style={styles.endHint}>All {total} products loaded</Text>
            ) : null
          }
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

      {showFilters ? (
        <ProductsFilterModal
          visible={modalOpen}
          options={filterOptions}
          value={applied}
          onClose={() => setModalOpen(false)}
          onApply={applyFilters}
          onClear={clearFilters}
        />
      ) : null}
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
  clearFiltersBtn: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  clearFiltersText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  count: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyWrap: {
    flex: 1,
  },
  endHint: {
    color: colors.textMuted,
    fontSize: 12,
    paddingVertical: spacing.md,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: spacing.md,
  },
  item: {
    flex: 1,
    maxWidth: '50%',
  },
  list: {
    paddingBottom: spacing.xl,
  },
  loadingBox: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
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
  sortFilterBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  sortFilterBtnActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  sortFilterChevron: {
    color: colors.textMuted,
    fontSize: 22,
    fontWeight: '300',
    marginLeft: spacing.sm,
  },
  sortFilterCopy: {
    flex: 1,
  },
  sortFilterLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sortFilterValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
});
