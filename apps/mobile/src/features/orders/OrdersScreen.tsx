import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useAppSelector } from '../../app/store';
import { formatInr } from '../../lib/productMedia';
import type { OrderHistoryItem } from './ordersSlice';
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

function OrderCard({
  item,
  onDetails,
}: {
  item: OrderHistoryItem;
  onDetails: () => void;
}) {
  const primary = item.items[0];
  const extraCount = Math.max(0, item.items.length - 1);
  const title = primary?.name ?? `${item.itemCount} item${item.itemCount === 1 ? '' : 's'}`;
  const price = primary ? primary.lineTotal : item.total;

  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        {primary?.imageUrl ? (
          <Image source={{ uri: primary.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.fallbackText}>📦</Text>
          </View>
        )}
        <View style={styles.copy}>
          <View style={styles.topRow}>
            <Text style={styles.orderNumber} numberOfLines={1}>
              {item.orderNumber}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{item.status.replace(/_/g, ' ')}</Text>
            </View>
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {title}
            {extraCount > 0 ? ` +${extraCount} more` : ''}
          </Text>
          <Text style={styles.price}>{formatInr(price)}</Text>
          <Text style={styles.meta}>
            {formatDate(item.createdAt)} · Total {formatInr(item.total)}
          </Text>
        </View>
      </View>
      <Pressable style={styles.detailsBtn} onPress={onDetails}>
        <Text style={styles.detailsText}>View details</Text>
      </Pressable>
    </View>
  );
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
            <Pressable
              style={styles.cta}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
            >
              <Text style={styles.ctaText}>Browse the forge</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard
            item={item}
            onDetails={() => navigation.navigate('OrderDetails', { orderId: item.id })}
          />
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
    overflow: 'hidden',
  },
  cardBody: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  copy: {
    flex: 1,
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
  detailsBtn: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: 12,
  },
  detailsText: {
    color: colors.accent,
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
  fallbackText: {
    fontSize: 22,
  },
  image: {
    backgroundColor: colors.background,
    borderRadius: 10,
    height: 84,
    marginRight: spacing.md,
    width: 84,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingBottom: spacing.xl,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  orderNumber: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  price: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 6,
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
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
