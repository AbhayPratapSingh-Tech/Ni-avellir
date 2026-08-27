import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../theme/tokens';

type Props = {
  visible: boolean;
  amountInr: number;
  orderNumber: string;
  demoMode: boolean;
  keyId: string;
  busy?: boolean;
  onPay: () => void;
  onCancel: () => void;
};

/** In-app Razorpay test/demo sheet (no native SDK required). */
export function RazorpayTestCheckout({
  visible,
  amountInr,
  orderNumber,
  demoMode,
  keyId,
  busy,
  onPay,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.brand}>Razorpay {demoMode ? 'Test / Demo' : 'Checkout'}</Text>
          <Text style={styles.order}>Order {orderNumber}</Text>
          <Text style={styles.amount}>₹{amountInr.toLocaleString('en-IN')}</Text>
          <Text style={styles.hint}>
            {demoMode
              ? 'No live keys configured — this uses a signed demo payment (same HMAC verify path as Test Mode).'
              : `Paying with key ${keyId}. Use Razorpay test cards in the dashboard docs.`}
          </Text>
          <Text style={styles.cardHint}>Test card: 4111 1111 1111 1111 · any future expiry · any CVV</Text>
          <Pressable
            style={[styles.payBtn, busy && styles.payBtnDisabled]}
            onPress={onPay}
            disabled={busy}
          >
            <Text style={styles.payText}>{busy ? 'Processing…' : 'Pay securely'}</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={busy}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  amount: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  brand: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  cardHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.lg,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  order: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  payBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
  },
  payBtnDisabled: {
    opacity: 0.6,
  },
  payText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '800',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
