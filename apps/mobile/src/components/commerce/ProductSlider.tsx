import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Product } from '@nidavellir/shared';
import { colors, spacing } from '../../theme/tokens';
import { ProductCard } from './ProductCard';

type Props = {
  title: string;
  products: Product[];
  onPress: (product: Product) => void;
};

export function ProductSlider({ title, products, onPress }: Props) {
  if (!products.length) {
    return null;
  }
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.track}
      >
        {products.map((product) => (
          <View key={product.id} style={styles.card}>
            <ProductCard product={product} onPress={onPress} compact />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginRight: 12,
    width: 168,
  },
  track: {
    paddingRight: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
});
