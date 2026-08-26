import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Product } from '@nidavellir/shared';
import { colors, spacing } from '../../theme/tokens';
import { productRepository } from '../../services/data/productRepository';
import type { RootStackParamList } from '../../app/navigation/types';
import { ProductSlider } from './ProductSlider';

type Variant = 'no-results' | 'out-of-stock' | 'restocking';

type Props = {
  variant: Variant;
};

const COPY: Record<Variant, { icon: string; title: string; body: string }> = {
  'no-results': {
    icon: '⌕',
    title: 'No result',
    body: 'This search did not match any gear. Try another keyword or browse below.',
  },
  'out-of-stock': {
    icon: '📦',
    title: 'Out of stock',
    body: 'This item is sold out for now. Check similar picks and bestsellers below.',
  },
  restocking: {
    icon: '⏳',
    title: 'Restocking soon',
    body: 'This item is coming back to the forge. Shop similar and bestseller picks below.',
  },
};

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function CatalogEmptyState({ variant }: Props) {
  const navigation = useNavigation<Navigation>();
  const copy = COPY[variant];
  const [alsoLike, setAlsoLike] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);

  useEffect(() => {
    productRepository.getAlsoLike(8).then(setAlsoLike);
    productRepository.getBestSellers().then(setBestSellers);
  }, []);

  const openProduct = (product: Product) => {
    navigation.navigate('ProductDetail', { product });
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.icon}>{copy.icon}</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
      </View>
      <View style={styles.sliders}>
        <ProductSlider title="You may also like" products={alsoLike} onPress={openProduct} />
        <ProductSlider title="Our best sellers" products={bestSellers} onPress={openProduct} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 280,
    textAlign: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  icon: {
    fontSize: 44,
    marginBottom: spacing.md,
  },
  sliders: {
    marginHorizontal: -spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  content: {
    paddingBottom: spacing.xl,
  },
  wrap: {
    flex: 1,
  },
});
