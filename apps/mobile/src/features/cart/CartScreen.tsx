import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../theme/tokens';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { removeItem, updateQuantity } from './cartSlice';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function CartScreen() {
  const navigation = useNavigation<Navigation>();
  const dispatch = useAppDispatch();
  const { items, subtotal, shipping, tax, total, itemCount } = useAppSelector(
    (state) => state.cart,
  );

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Your forge is empty</Text>
        <Text style={styles.emptySub}>Add some gear to begin your collection.</Text>
        <Pressable style={styles.cta} onPress={() => navigation.navigate('MainTabs')}>
          <Text style={styles.ctaText}>Browse gear</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Cart ({itemCount})</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.line}>
            <Image source={{ uri: item.product.imageUrl }} style={styles.image} />
            <View style={styles.lineInfo}>
              <Text style={styles.lineName} numberOfLines={2}>
                {item.product.name}
              </Text>
              <Text style={styles.linePrice}>
                ₹{item.lineTotal.toLocaleString('en-IN')}
              </Text>
              <View style={styles.qtyRow}>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() =>
                    dispatch(updateQuantity({ productId: item.product.id, quantity: item.quantity - 1 }))
                  }
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </Pressable>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() =>
                    dispatch(updateQuantity({ productId: item.product.id, quantity: item.quantity + 1 }))
                  }
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </Pressable>
                <Pressable
                  style={styles.remove}
                  onPress={() => dispatch(removeItem(item.product.id))}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.summary}>
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>Subtotal</Text>
          <Text style={styles.sumValue}>₹{subtotal.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>Shipping</Text>
          <Text style={styles.sumValue}>{shipping === 0 ? 'Free' : `₹${shipping}`}</Text>
        </View>
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>Tax (5%)</Text>
          <Text style={styles.sumValue}>₹{tax.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.sumRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{total.toLocaleString('en-IN')}</Text>
        </View>
        <Pressable style={styles.cta} onPress={() => navigation.navigate('Checkout')}>
          <Text style={styles.ctaText}>Proceed to checkout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cta: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    marginTop: spacing.md,
    paddingVertical: 14,
  },
  ctaText: {
    color: '#07130D',
    fontSize: typography.body,
    fontWeight: '800',
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  image: {
    borderRadius: 10,
    height: 80,
    width: 80,
  },
  line: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  lineInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  lineName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  linePrice: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  list: {
    paddingBottom: spacing.lg,
  },
  qtyBtn: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 6,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  qtyBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  qtyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  qtyValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginHorizontal: spacing.sm,
  },
  remove: {
    marginLeft: 'auto',
  },
  removeText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.md,
  },
  sumLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  sumValue: {
    color: colors.text,
    fontSize: 14,
  },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  totalLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  totalRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  totalValue: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '800',
  },
});
