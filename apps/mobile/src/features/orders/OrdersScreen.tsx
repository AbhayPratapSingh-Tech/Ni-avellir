import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useAppSelector } from '../../app/store';
import { formatInr } from '../../lib/productMedia';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function OrdersScreen() {
  const navigation = useNavigation<Navigation>();
  const orders = useAppSelector((state) => state.orders.items);

  return (
    <Screen edges={[]} style={styles.screen}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={orders.length === 0 ? styles.emptyContent : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySub}>Place an order and it will show up here.</Text>
            <Pressable style={styles.cta} onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}>
              <Text style={styles.ctaText}>Browse the forge</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.orderNumber}>{item.orderNumber}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.meta}>Placed on</Text>
              <Text style={styles.value}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.meta}>Total</Text>
              <Text style={styles.value}>{formatInr(item.total)}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.meta}>Items</Text>
              <Text style={styles.value}>{item.itemCount}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.meta}>Est. delivery</Text>
              <Text style={styles.value}>{item.estimatedDelivery}</Text>
            </View>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  cardTop: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
  },
  cta: {
    backgroundColor: colors.text,
    borderRadius: 12,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
  },
  ctaText: {
    color: colors.onAccent,
    fontSize: 14,
    fontWeight: '800',
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyContent: {
    flexGrow: 1,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  list: {
    paddingBottom: spacing.xl,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
  },
  orderNumber: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.md,
  },
  statusBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
