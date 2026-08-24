import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, spacing } from '../../theme/tokens';
import { shopCategories, type ShopCategory } from '../../lib/shopCategories';

type Props = {
  onPress: (item: ShopCategory) => void;
};

export function CategoryCircleSlider({ onPress }: Props) {
  const { width } = useWindowDimensions();
  const itemWidth = (width - spacing.md * 2) / 2.5;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
      decelerationRate="fast"
      snapToInterval={itemWidth}
    >
      {shopCategories.map((item) => (
        <Pressable key={item.id} style={[styles.item, { width: itemWidth }]} onPress={() => onPress(item)}>
          <Image source={{ uri: item.image }} style={[styles.circle, { width: itemWidth - 16, height: itemWidth - 16 }]} />
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
  },
  item: {
    alignItems: 'center',
    paddingRight: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  track: {
    paddingRight: spacing.md,
  },
});
