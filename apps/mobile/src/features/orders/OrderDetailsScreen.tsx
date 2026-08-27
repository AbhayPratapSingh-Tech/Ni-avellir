import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useAppSelector } from '../../app/store';
import { formatInr } from '../../lib/productMedia';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'OrderDetails'>;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function paymentLabel(method?: string) {
  if (method === 'cash_on_delivery') return 'Cash on Delivery';
  if (method === 'razorpay_demo') return 'UPI / Card (Razorpay)';
  return method || '—';
}

type TimelineStep = { key: string; label: string; done: boolean; active: boolean };

function buildTimeline(status: string): TimelineStep[] {
  const normalized = status.toLowerCase();
  const delivered = normalized.includes('deliver');
  const confirmed =
    delivered ||
    normalized.includes('paid') ||
    normalized.includes('confirm') ||
    normalized.includes('ship');
  const pendingPayment = normalized.includes('pending');

  return [
    { key: 'placed', label: 'Order placed', done: true, active: false },
    {
      key: 'payment',
      label: pendingPayment ? 'Payment pending' : 'Payment',
      done: !pendingPayment,
      active: pendingPayment,
    },
    {
      key: 'confirmed',
      label: 'Confirmed',
      done: confirmed,
      active: !pendingPayment && confirmed && !delivered,
    },
    {
      key: 'delivered',
      label: 'Delivered',
      done: delivered,
      active: delivered,
    },
  ];
}

export function OrderDetailsScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const order = useAppSelector((state) =>
    state.orders.items.find((item) => item.id === route.params.orderId),
  );

  if (!order) {
    return (
      <Screen edges={[]} style={styles.screen}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Order not found</Text>
          <Pressable style={styles.cta} onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.ctaText}>Back to orders</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const timeline = buildTimeline(order.status);
  const address = order.shippingAddress;

  return (
    <Screen edges={[]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{order.status.replace(/_/g, ' ')}</Text>
            </View>
          </View>
          <Text style={styles.metaLine}>Placed on {formatDate(order.createdAt)}</Text>
          <Text style={styles.metaLine}>
            Expected by{' '}
            {order.estimatedDelivery.includes('-') && !order.estimatedDelivery.includes('business')
              ? formatDate(order.estimatedDelivery)
              : order.estimatedDelivery}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Order progress</Text>
        <View style={styles.timelineCard}>
          {timeline.map((step, index) => {
            const isLast = index === timeline.length - 1;
            return (
              <View key={step.key} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View
                    style={[
                      styles.dot,
                      step.done || step.active ? styles.dotOn : styles.dotOff,
                      step.active && styles.dotActive,
                    ]}
                  />
                  {!isLast ? (
                    <View style={[styles.rail, step.done ? styles.railOn : styles.railOff]} />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.timelineLabel,
                    (step.done || step.active) && styles.timelineLabelOn,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Items</Text>
        <View style={styles.card}>
          {order.items.map((line) => (
            <View key={`${line.productId}-${line.name}`} style={styles.lineRow}>
              {line.imageUrl ? (
                <Image source={{ uri: line.imageUrl }} style={styles.lineImage} />
              ) : (
                <View style={[styles.lineImage, styles.lineImageFallback]}>
                  <Text style={styles.fallbackText}>?</Text>
                </View>
              )}
              <View style={styles.lineCopy}>
                <Text style={styles.lineName} numberOfLines={2}>
                  {line.name}
                </Text>
                <Text style={styles.lineMeta}>
                  Qty {line.quantity} · {formatInr(line.price)}
                </Text>
              </View>
              <Text style={styles.lineTotal}>{formatInr(line.lineTotal)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Price summary</Text>
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatInr(order.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>
              {order.shipping === 0 ? 'Free' : formatInr(order.shipping)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxes</Text>
            <Text style={styles.summaryValue}>{formatInr(order.tax)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Final price</Text>
            <Text style={styles.totalValue}>{formatInr(order.total)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment</Text>
            <Text style={styles.summaryValue}>{paymentLabel(order.paymentMethod)}</Text>
          </View>
        </View>

        {address ? (
          <>
            <Text style={styles.sectionTitle}>Delivery address</Text>
            <View style={styles.card}>
              <Text style={styles.addressName}>{address.fullName}</Text>
              <Text style={styles.addressLine}>{address.line1}</Text>
              <Text style={styles.addressLine}>
                {address.city}, {address.state} {address.postalCode}
              </Text>
              <Text style={styles.addressLine}>Phone {address.phone}</Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addressLine: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  addressName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
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
  dot: {
    borderRadius: 7,
    height: 14,
    width: 14,
  },
  dotActive: {
    borderColor: colors.accent,
    borderWidth: 3,
  },
  dotOff: {
    backgroundColor: colors.border,
  },
  dotOn: {
    backgroundColor: colors.accent,
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  fallbackText: {
    color: colors.textMuted,
    fontWeight: '800',
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  headerTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  lineCopy: {
    flex: 1,
    marginRight: spacing.sm,
  },
  lineImage: {
    backgroundColor: colors.background,
    borderRadius: 8,
    height: 64,
    marginRight: spacing.md,
    width: 64,
  },
  lineImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  lineName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  lineRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  lineTotal: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  metaLine: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  orderNumber: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    marginRight: spacing.sm,
  },
  rail: {
    flex: 1,
    marginVertical: 2,
    width: 2,
  },
  railOff: {
    backgroundColor: colors.border,
  },
  railOn: {
    backgroundColor: colors.accent,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
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
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  summaryTotal: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  timelineCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  timelineLabel: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingBottom: spacing.md,
  },
  timelineLabelOn: {
    color: colors.text,
    fontWeight: '800',
  },
  timelineRail: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 36,
  },
  totalLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  totalValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
});
