import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/tokens';
import { useAppSelector } from '../../app/store';
import type { RootStackParamList } from '../../app/navigation/types';

export function FloatingCartButton() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const count = useAppSelector((state) => state.cart.itemCount);

  return (
    <Pressable
      style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 16 }]}
      onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}
      accessibilityLabel="Open cart"
    >
      <Text style={styles.icon}>🛒</Text>
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: 6,
    top: 6,
  },
  badgeText: {
    color: colors.onAccent,
    fontSize: 10,
    fontWeight: '800',
  },
  fab: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 28,
    elevation: 6,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    width: 56,
  },
  icon: {
    fontSize: 22,
  },
});
