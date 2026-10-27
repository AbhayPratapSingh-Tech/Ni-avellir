import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Product } from '@nidavellir/shared';
import { colors, spacing, typography } from '../../theme/tokens';
import { ProductCard } from '../../components/commerce/ProductCard';
import { CatalogEmptyState } from '../../components/commerce/CatalogEmptyState';
import { FloatingCartButton } from '../../components/commerce/FloatingCartButton';
import { Screen } from '../../components/ui/Screen';
import { MicButton } from '../../components/ui/MicButton';
import { CameraSearchButton } from '../../components/ui/CameraSearchButton';
import { productRepository, type SearchSuggestions } from '../../services/data/productRepository';
import { useAppDispatch } from '../../app/store';
import { addProductToCart } from '../../lib/cartActions';
import { useToast } from '../../components/ui/Toast';
import { goBackOrHome } from '../../lib/navigation';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { pickVisualSearchImage } from '../../lib/visualSearchPick';
import { getApiErrorMessage } from '../../services/api/apiClient';
import { appConfig } from '../../config/appConfig';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function SearchScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute();
  const params = (route.params ?? {}) as { q?: string; openVisualSearch?: boolean };
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [query, setQuery] = useState(params.q ?? '');
  const [products, setProducts] = useState<Product[]>([]);
  const [visualBusy, setVisualBusy] = useState(false);
  const visualKickoffDone = useRef(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestions>({
    queries: [],
    categories: [],
    franchises: [],
    brands: [],
  });

  const speech = useSpeechToText({
    onFinal: ({ transcript }) => setQuery(transcript),
    onError: (message) => toast.show(message),
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

  useEffect(() => {
    if (speech.listening && speech.partial) {
      setQuery(speech.partial);
    }
  }, [speech.listening, speech.partial]);

  const runVisualSearch = useCallback(async () => {
    if (!appConfig.features.visualSearch) return;
    if (appConfig.dataSource !== 'api') {
      toast.show('Visual search needs the live API');
      return;
    }
    const picked = await pickVisualSearchImage();
    if (picked.error) {
      toast.show(picked.error);
      return;
    }
    if (!picked.uri) return;
    setVisualBusy(true);
    try {
      const result = await productRepository.visualSearch(picked.uri);
      if (result.reason === 'vision_unavailable') {
        toast.show('Visual search is unavailable right now');
        return;
      }
      if (result.query) {
        setQuery(result.query);
      }
      setProducts(result.products);
      if (!result.products.length) {
        toast.show(result.query ? 'No matches for that photo' : 'No matches found');
      }
    } catch (error) {
      toast.show(getApiErrorMessage(error));
    } finally {
      setVisualBusy(false);
    }
  }, [toast]);

  useFocusEffect(
    useCallback(() => {
      if (!params.openVisualSearch || visualKickoffDone.current) {
        return;
      }
      visualKickoffDone.current = true;
      void runVisualSearch();
      navigation.setParams({ openVisualSearch: undefined });
    }, [navigation, params.openVisualSearch, runVisualSearch]),
  );

  const handleAdd = useCallback(
    (product: Product) => {
      void addProductToCart({ product, dispatch, toast }).then((ok) => {
        if (ok) toast.show('Struck the cart ⚡');
      });
    },
    [dispatch, toast],
  );

  const emptyQuery = !query.trim() && products.length === 0;
  const allOutOfStock = products.length > 0 && products.every((item) => item.stock === 0);

  return (
    <Screen edges={['top']} style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={() => goBackOrHome(navigation)} hitSlop={12} style={styles.back}>
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
        {appConfig.features.visualSearch ? (
          <CameraSearchButton
            busy={visualBusy}
            onPress={() => {
              void runVisualSearch();
            }}
            size={40}
          />
        ) : null}
        {appConfig.features.voiceInput ? (
          <MicButton
            listening={speech.listening}
            onPress={() => {
              void speech.toggle();
            }}
            size={40}
          />
        ) : null}
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
            {suggestions.brands.map((item) => (
              <Pressable
                key={item}
                style={[styles.chip, styles.brandChip]}
                onPress={() => navigation.navigate('Products', { franchise: item, title: item })}
              >
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
      ) : products.length === 0 ? (
        <CatalogEmptyState variant="no-results" />
      ) : allOutOfStock ? (
        <CatalogEmptyState variant="out-of-stock" />
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
  brandChip: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
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
    maxWidth: '50%',
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
