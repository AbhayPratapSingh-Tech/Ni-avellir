import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useAppSelector } from '../../app/store';
import { useToast } from '../../components/ui/Toast';
import { formatInr } from '../../lib/productMedia';
import { orderRepository } from '../../services/data/orderRepository';
import { getApiErrorMessage } from '../../services/api/apiClient';
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
  const cancelled = normalized.includes('cancel');
  const confirmed =
    delivered ||
    normalized.includes('paid') ||
    normalized.includes('confirm') ||
    normalized.includes('ship');
  const pendingPayment = normalized.includes('pending');

  if (cancelled) {
    return [
      { key: 'placed', label: 'Order placed', done: true, active: false },
      { key: 'cancelled', label: 'Cancelled', done: true, active: true },
    ];
  }

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
  const toast = useToast();
  const order = useAppSelector((state) =>
    state.orders.items.find((item) => item.id === route.params.orderId),
  );
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');

  if (!order) {
    return (
      <Screen edges={[]} style={styles.screen}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Order not found</Text>
          <Pressable
            style={styles.cta}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }
              navigation.navigate('Orders');
            }}
          >
            <Text style={styles.ctaText}>Back to orders</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const timeline = buildTimeline(order.status);
  const address = order.shippingAddress;
  const statusLower = order.status.toLowerCase();
  const canCancel =
    !statusLower.includes('cancel') &&
    !statusLower.includes('deliver') &&
    !statusLower.includes('ship');
  const canReturnOrExchange =
    statusLower.includes('deliver') || statusLower.includes('confirm') || statusLower.includes('paid');

  const runAction = async (kind: 'cancel' | 'return' | 'exchange') => {
    const note = reason.trim() || (kind === 'cancel' ? 'Changed mind' : 'Issue with order');
    setBusy(true);
    try {
      if (kind === 'cancel') await orderRepository.cancel(order.id, note);
      if (kind === 'return') await orderRepository.requestReturn(order.id, note);
      if (kind === 'exchange') await orderRepository.requestExchange(order.id, note);
      toast.show(
        kind === 'cancel' ? 'Order cancelled' : kind === 'return' ? 'Return requested' : 'Exchange requested',
      );
      setReason('');
      await orderRepository.syncToStore();
    } catch (error) {
      toast.show(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const confirmAction = (kind: 'cancel' | 'return' | 'exchange') => {
    Alert.alert(
      kind === 'cancel' ? 'Cancel order?' : kind === 'return' ? 'Request return?' : 'Request exchange?',
      'You can add an optional reason below before confirming.',
      [
        { text: 'Back', style: 'cancel' },
        { text: 'Confirm', style: kind === 'cancel' ? 'destructive' : 'default', onPress: () => void runAction(kind) },
      ],
    );
  };

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
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>{formatInr(order.tax)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{formatInr(order.total)}</Text>
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

        {(canCancel || canReturnOrExchange) && (
          <>
            <Text style={styles.sectionTitle}>Need help?</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.reasonInput}
                placeholder="Optional reason"
                placeholderTextColor={colors.textMuted}
                value={reason}
                onChangeText={setReason}
              />
              {canCancel ? (
                <Pressable
                  style={[styles.actionBtn, styles.dangerBtn]}
                  disabled={busy}
                  onPress={() => confirmAction('cancel')}
                >
                  <Text style={styles.actionBtnText}>Cancel order</Text>
                </Pressable>
              ) : null}
              {canReturnOrExchange ? (
                <>
                  <Pressable
                    style={styles.actionBtn}
                    disabled={busy}
                    onPress={() => confirmAction('return')}
                  >
                    <Text style={styles.actionBtnDark}>Request return</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionBtn}
                    disabled={busy}
                    onPress={() => confirmAction('exchange')}
                  >
                    <Text style={styles.actionBtnDark}>Request exchange</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: spacing.sm,
    paddingVertical: 12,
  },
  actionBtnDark: { color: colors.text, fontWeight: '800', textAlign: 'center' },
  actionBtnText: { color: colors.onAccent, fontWeight: '800', textAlign: 'center' },
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
  dangerBtn: { backgroundColor: colors.danger, borderWidth: 0 },
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
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  fallbackText: { fontSize: 18 },
  headerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between' },
  lineCopy: { flex: 1, marginHorizontal: spacing.sm },
  lineImage: { borderRadius: 8, height: 56, width: 56 },
  lineImageFallback: {
    alignItems: 'center',
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  lineMeta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  lineName: { color: colors.text, fontWeight: '700' },
  lineRow: { alignItems: 'center', flexDirection: 'row', marginBottom: spacing.sm },
  lineTotal: { color: colors.text, fontWeight: '800' },
  metaLine: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  orderNumber: { color: colors.text, flex: 1, fontSize: 16, fontWeight: '800' },
  rail: { flex: 1, marginVertical: 2, width: 2 },
  railOff: { backgroundColor: colors.border },
  railOn: { backgroundColor: colors.accent },
  reasonInput: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    marginBottom: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  screen: { backgroundColor: colors.background, flex: 1 },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  statusBadge: {
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { color: colors.text, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  summaryLabel: { color: colors.textMuted },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryValue: { color: colors.text, fontWeight: '700' },
  timelineCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  timelineLabel: { color: colors.textMuted, flex: 1, fontSize: 14, marginLeft: spacing.sm },
  timelineLabelOn: { color: colors.text, fontWeight: '700' },
  timelineRail: { alignItems: 'center', width: 14 },
  timelineRow: { flexDirection: 'row', minHeight: 36 },
});
