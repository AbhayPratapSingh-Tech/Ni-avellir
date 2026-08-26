import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/tokens';
import { BrandMark } from '../ui/BrandMark';
import { useAppSelector } from '../../app/store';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  onMenuPress: () => void;
};

export function cartBadgeLabel(count: number) {
  if (count <= 0) return null;
  return count > 9 ? '9+' : String(count);
}

export function ShopHeader({ onMenuPress }: Props) {
  const navigation = useNavigation<Navigation>();
  const itemCount = useAppSelector((state) => state.cart.itemCount);
  const wishlistCount = useAppSelector((state) => state.wishlist.items.length);
  const cartBadge = cartBadgeLabel(itemCount);
  const wishBadge = cartBadgeLabel(wishlistCount);

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onMenuPress}
        style={styles.sideBtn}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
      >
        <Text style={styles.menuIcon}>≡</Text>
      </Pressable>
      <View style={styles.logo}>
        <BrandMark size={48} />
      </View>
      <View style={styles.rightActions}>
        <Pressable
          onPress={() => navigation.navigate('Wishlist')}
          style={styles.sideBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open wishlist"
        >
          <Text style={styles.wishIcon}>♡</Text>
          {wishBadge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{wishBadge}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}
          style={styles.sideBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open cart"
        >
          <Text style={styles.cartIcon}>🛒</Text>
          {cartBadge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartBadge}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
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
    right: 2,
    top: 2,
  },
  badgeText: {
    color: colors.onAccent,
    fontSize: 10,
    fontWeight: '800',
  },
  cartIcon: {
    fontSize: 20,
  },
  logo: {
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 24,
  },
  rightActions: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
  },
  sideBtn: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 40,
  },
  wishIcon: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
});
