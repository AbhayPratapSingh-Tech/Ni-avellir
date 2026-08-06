import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../theme/tokens';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { clearCart } from '../cart/cartSlice';
import { productRepository } from '../../services/data/productRepository';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const PAYMENT_METHODS = [
  { id: 'cash_on_delivery', label: 'Cash on Delivery', desc: 'Pay when it arrives' },
  { id: 'razorpay_demo', label: 'UPI / Card (Razorpay)', desc: 'Secure online payment' },
] as const;

const STEPS = ['Address', 'Payment', 'Review'] as const;
type Step = (typeof STEPS)[number];

export function CheckoutScreen() {
  const navigation = useNavigation<Navigation>();
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart);
  const [step, setStep] = useState<Step>('Address');
  const [submitting, setSubmitting] = useState(false);

  // Address fields.
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [payment, setPayment] = useState<string>('cash_on_delivery');

  const addressComplete =
    fullName && phone && line1 && city && stateName && postalCode;

  const placeOrder = async () => {
    if (!addressComplete) return;
    setSubmitting(true);
    try {
      const itemInputs = cart.items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));
      const email = 'demo@nidavellir.app';
      const order = await productRepository.createOrder({
        customer: { name: fullName, email, phone },
        items: itemInputs,
        shippingAddress: {
          fullName,
          phone,
          line1,
          city,
          state: stateName,
          postalCode,
        },
        paymentMethod: payment,
      });
      dispatch(clearCart());
      navigation.replace('OrderConfirmation', { orderId: order.id ?? order.orderNumber });
    } catch (error) {
      Alert.alert('Order failed', (error as Error).message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.steps}>
        {STEPS.map((s) => (
          <View key={s} style={styles.stepWrap}>
            <View style={[styles.stepDot, step === s && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step === s && styles.stepDotTextActive]}>
                {STEPS.indexOf(s) + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, step === s && styles.stepLabelActive]}>{s}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {step === 'Address' ? (
          <View>
            {[
              ['Full name', fullName, setFullName, 'keyboard'],
              ['Phone', phone, setPhone, 'phone-pad'],
              ['Address line 1', line1, setLine1, 'default'],
              ['City', city, setCity, 'default'],
              ['State', stateName, setStateName, 'default'],
              ['Postal code', postalCode, setPostalCode, 'number-pad'],
            ].map(([label, value, setter, keyboard]) => (
              <TextInput
                key={label as string}
                style={styles.input}
                placeholder={label as string}
                placeholderTextColor={colors.textMuted}
                value={value as string}
                onChangeText={setter as (t: string) => void}
                keyboardType={keyboard as 'default'}
              />
            ))}
          </View>
        ) : null}

        {step === 'Payment' ? (
          <View>
            {PAYMENT_METHODS.map((m) => (
              <Pressable
                key={m.id}
                style={[styles.payCard, payment === m.id && styles.payCardActive]}
                onPress={() => setPayment(m.id)}
              >
                <View style={[styles.radio, payment === m.id && styles.radioActive]}>
                  {payment === m.id ? <View style={styles.radioInner} /> : null}
                </View>
                <View style={styles.payInfo}>
                  <Text style={styles.payLabel}>{m.label}</Text>
                  <Text style={styles.payDesc}>{m.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {step === 'Review' ? (
          <View>
            <Text style={styles.reviewTitle}>Items ({cart.itemCount})</Text>
            {cart.items.map((item) => (
              <View key={item.product.id} style={styles.reviewLine}>
                <Text style={styles.reviewName} numberOfLines={1}>
                  {item.quantity} × {item.product.name}
                </Text>
                <Text style={styles.reviewPrice}>
                  ₹{item.lineTotal.toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.reviewLine}>
              <Text style={styles.reviewMeta}>Subtotal</Text>
              <Text style={styles.reviewMetaValue}>₹{cart.subtotal.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.reviewLine}>
              <Text style={styles.reviewMeta}>Shipping</Text>
              <Text style={styles.reviewMetaValue}>
                {cart.shipping === 0 ? 'Free' : `₹${cart.shipping}`}
              </Text>
            </View>
            <View style={styles.reviewLine}>
              <Text style={styles.reviewMeta}>Tax</Text>
              <Text style={styles.reviewMetaValue}>₹{cart.tax.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.reviewLine}>
              <Text style={styles.reviewTotal}>Total</Text>
              <Text style={styles.reviewTotalValue}>₹{cart.total.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.reviewMeta}>Deliver to</Text>
            <Text style={styles.reviewAddress}>
              {fullName}, {line1}, {city}, {stateName} {postalCode}
            </Text>
            <Text style={styles.reviewMeta}>Payment</Text>
            <Text style={styles.reviewAddress}>
              {PAYMENT_METHODS.find((m) => m.id === payment)?.label}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {step !== 'Address' ? (
          <Pressable
            style={[styles.backBtn, submitting && styles.btnDisabled]}
            disabled={submitting}
onPress={() => setStep(STEPS[STEPS.indexOf(step) - 1] as Step)}
          >
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        ) : null}

        {step === 'Review' ? (
          <Pressable
            style={[styles.primaryBtn, submitting && styles.btnDisabled]}
            disabled={submitting}
            onPress={placeOrder}
          >
            <Text style={styles.primaryBtnText}>
              {submitting ? 'Placing order...' : `Place order · ₹${cart.total.toLocaleString('en-IN')}`}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.primaryBtn, !addressComplete && step === 'Address' && styles.btnDisabled]}
            disabled={(step === 'Address' && !addressComplete) || submitting}
onPress={() => setStep(STEPS[STEPS.indexOf(step) + 1] as Step)}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: spacing.sm,
    paddingVertical: 14,
    width: 90,
  },
  backBtnText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.md,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.md,
  },
  footer: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    padding: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  payCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  payCardActive: {
    borderColor: colors.accent,
  },
  payDesc: {
    color: colors.textMuted,
    fontSize: 12,
  },
  payInfo: {
    marginLeft: spacing.sm,
  },
  payLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 14,
  },
  primaryBtnText: {
    color: '#07130D',
    fontSize: typography.body,
    fontWeight: '800',
    textAlign: 'center',
  },
  radio: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  radioActive: {
    borderColor: colors.accent,
  },
  radioInner: {
    backgroundColor: colors.accent,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  reviewAddress: {
    color: colors.text,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  reviewLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  reviewMeta: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  reviewMetaValue: {
    color: colors.text,
    fontSize: 14,
  },
  reviewName: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
  },
  reviewPrice: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  reviewTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  reviewTotal: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  reviewTotalValue: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  stepDot: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  stepDotActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  stepDotText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  stepDotTextActive: {
    color: '#07130D',
  },
  stepLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  stepLabelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  steps: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
  },
  stepWrap: {
    alignItems: 'center',
  },
});
