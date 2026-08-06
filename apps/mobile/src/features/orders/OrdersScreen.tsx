import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme/tokens';
import { appConfig } from '../../config/appConfig';
import { apiClient } from '../../services/api/apiClient';

type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  estimatedDelivery: string;
  itemCount: number;
  createdAt: string;
};

export function OrdersScreen() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (appConfig.dataSource === 'api') {
      try {
        const { data } = await apiClient.get('/orders');
        setOrders(data.data.orders);
        return;
      } catch {
        // fall through to mock
      }
    }
    setOrders([]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Orders</Text>
      <FlatList
        data={orders ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={orders?.length === 0 ? styles.emptyContent : styles.list}
        ListEmptyComponent={
          orders === null ? (
            <Text style={styles.emptySub}>Loading...</Text>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySub}>Your forged purchases will appear here.</Text>
            </View>
          )
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
              <Text style={styles.meta}>Total</Text>
              <Text style={styles.value}>
                ₹{item.total ? item.total.toLocaleString('en-IN') : '—'}
              </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
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
    backgroundColor: 'rgba(46,242,167,0.15)',
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
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
