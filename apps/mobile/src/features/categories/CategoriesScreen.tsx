import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { shopCategories, type ShopCategory } from '../../lib/shopCategories';
import type { RootStackParamList } from '../../app/navigation/types';

export function CategoriesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const open = (item: ShopCategory) => {
    navigation.navigate('Products', {
      title: item.name,
      category: item.category,
      q: item.q,
      collection: item.collection,
    });
  };

  return (
    <Screen style={styles.screen}>
      <Text style={styles.title}>Categories</Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {shopCategories.map((item) => (
          <Pressable key={item.id} style={styles.item} onPress={() => open(item)}>
            <Image source={{ uri: item.image }} style={styles.circle} />
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 48,
    borderWidth: 1,
    height: 96,
    width: 96,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: spacing.xl,
  },
  item: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    width: '33.33%',
  },
  name: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
});
