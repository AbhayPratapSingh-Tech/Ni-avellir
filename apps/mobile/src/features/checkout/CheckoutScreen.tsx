import { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../theme/tokens';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { clearCart } from '../cart/cartSlice';
import { addOrder } from '../orders/ordersSlice';
import { productRepository } from '../../services/data/productRepository';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const PAYMENT_METHODS = [
  { id: 'cash_on_delivery', label: 'Cash on Delivery', desc: 'Pay when it arrives' },
  { id: 'razorpay_demo', label: 'UPI / Card (Razorpay)', desc: 'Secure online payment' },
] as const;

const STEPS = ['Address', 'Payment', 'Review'] as const;
type Step = (typeof STEPS)[number];

type AddressErrors = Partial<{
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  stateName: string;
  postalCode: string;
}>;

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

function validateAddress(fields: {
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  stateName: string;
  postalCode: string;
}): AddressErrors {
  const errors: AddressErrors = {};
  const name = fields.fullName.trim();
  const phone = digitsOnly(fields.phone);
  const line1 = fields.line1.trim();
  const city = fields.city.trim();
  const stateName = fields.stateName.trim();
  const postal = digitsOnly(fields.postalCode);

  if (!name) errors.fullName = 'Full name is required';
  else if (name.length < 2) errors.fullName = 'Enter at least 2 characters';

  if (!phone) errors.phone = 'Phone number is required';
  else if (phone.length !== 10) errors.phone = 'Enter a valid 10-digit mobile number';

  if (!line1) errors.line1 = 'Address is required';

  if (!city) errors.city = 'City is required';
  else if (!/^[a-zA-Z\s.'-]+$/.test(city)) errors.city = 'City should contain letters only';

  if (!stateName) errors.stateName = 'State is required';
  else if (!/^[a-zA-Z\s.'-]+$/.test(stateName)) errors.stateName = 'State should contain letters only';

  if (!postal) errors.postalCode = 'Postal code is required';
  else if (!/^\d{6}$/.test(postal)) errors.postalCode = 'Enter a valid 6-digit PIN code';

  return errors;
}

export function CheckoutScreen() {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart);
  const [step, setStep] = useState<Step>('Address');
  const [submitting, setSubmitting] = useState(false);
  const [triedAddress, setTriedAddress] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [payment, setPayment] = useState<string>('cash_on_delivery');

  const addressErrors = useMemo(
    () =>
      validateAddress({
        fullName,
        phone,
        line1,
        city,
        stateName,
        postalCode,
      }),
    [fullName, phone, line1, city, stateName, postalCode],
  );
  const addressValid = Object.keys(addressErrors).length === 0;
  const stepIndex = STEPS.indexOf(step);
  // 3-button Android nav is ~48dp; insets.bottom can be 0 with translucent bars.
  const footerPadBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 16);

  const goNextFromAddress = () => {
    setTriedAddress(true);
    if (!addressValid) return;
    setStep('Payment');
  };

  const placeOrder = async () => {
    if (!addressValid) {
      setStep('Address');
      setTriedAddress(true);
      return;
    }
    setSubmitting(true);
    try {
      const itemInputs = cart.items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));
      const email = 'demo@nidavellir.app';
      const order = await productRepository.createOrder({
        customer: { name: fullName.trim(), email, phone: digitsOnly(phone) },
        items: itemInputs,
        shippingAddress: {
          fullName: fullName.trim(),
          phone: digitsOnly(phone),
          line1: line1.trim(),
          city: city.trim(),
          state: stateName.trim(),
          postalCode: digitsOnly(postalCode),
        },
        paymentMethod: payment,
      });
      dispatch(
        addOrder({
          id: order.id,
          orderNumber: order.orderNumber ?? order.id,
          status: order.status ?? 'confirmed',
          total: order.total ?? cart.total,
          currency: order.currency ?? 'INR',
          estimatedDelivery: order.estimatedDelivery ?? '3–5 business days',
          itemCount: order.items?.length
            ? order.items.reduce(
                (sum: number, line: { quantity?: number }) => sum + (line.quantity ?? 0),
                0,
              )
            : cart.itemCount,
          createdAt: order.createdAt ?? new Date().toISOString(),
          paymentMethod: payment,
        }),
      );
      dispatch(clearCart());
      navigation.replace('OrderConfirmation', { orderId: order.orderNumber ?? order.id });
    } catch (error) {
      Alert.alert('Order failed', (error as Error).message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const showError = (key: keyof AddressErrors) =>
    triedAddress && addressErrors[key] ? addressErrors[key] : undefined;

  return (
    <View style={styles.screen}>
      <View style={styles.steps}>
        {STEPS.map((label, index) => {
          const reached = index <= stepIndex;
          const showLine = index < STEPS.length - 1;
          const lineFilled = index < stepIndex;

          return (
            <View key={label} style={[styles.stepSegment, !showLine && styles.stepSegmentEnd]}>
              <View style={styles.stepNode}>
                <View style={[styles.stepChip, reached ? styles.stepChipOn : styles.stepChipOff]}>
                  <Text
                    style={[styles.stepChipText, reached ? styles.stepChipTextOn : styles.stepChipTextOff]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text style={[styles.stepLabel, reached && styles.stepLabelOn]}>{label}</Text>
              </View>
              {showLine ? <View style={[styles.stepLine, lineFilled && styles.stepLineOn]} /> : null}
            </View>
          );
        })}
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'Address' ? (
          <View>
            <Text style={styles.sectionTitle}>Shipping address</Text>

            <Field
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              error={showError('fullName')}
              autoCapitalize="words"
            />
            <Field
              label="Phone"
              value={phone}
              onChangeText={(value) => setPhone(digitsOnly(value).slice(0, 10))}
              error={showError('phone')}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <Field
              label="Address line 1"
              value={line1}
              onChangeText={setLine1}
              error={showError('line1')}
            />
            <Field
              label="City"
              value={city}
              onChangeText={setCity}
              error={showError('city')}
              autoCapitalize="words"
            />
            <Field
              label="State"
              value={stateName}
              onChangeText={setStateName}
              error={showError('stateName')}
              autoCapitalize="words"
            />
            <Field
              label="Postal code"
              value={postalCode}
              onChangeText={(value) => setPostalCode(digitsOnly(value).slice(0, 6))}
              error={showError('postalCode')}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        ) : null}

        {step === 'Payment' ? (
          <View>
            <Text style={styles.sectionTitle}>Payment method</Text>
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
            <Text style={styles.sectionTitle}>Order review</Text>
            <Text style={styles.reviewTitle}>Items ({cart.itemCount})</Text>
            {cart.items.map((item) => (
              <View key={item.product.id} style={styles.reviewLine}>
                <Text style={styles.reviewName} numberOfLines={1}>
                  {item.quantity} × {item.product.name}
                </Text>
                <Text style={styles.reviewPrice}>₹{item.lineTotal.toLocaleString('en-IN')}</Text>
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

      <View style={[styles.footer, { paddingBottom: footerPadBottom + 10 }]}>
        {step !== 'Address' ? (
          <Pressable
            style={[styles.backBtn, submitting && styles.btnDisabled]}
            disabled={submitting}
            onPress={() => setStep(STEPS[stepIndex - 1]!)}
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
            style={[styles.primaryBtn, submitting && styles.btnDisabled]}
            disabled={submitting}
            onPress={() => {
              if (step === 'Address') {
                goNextFromAddress();
                return;
              }
              setStep(STEPS[stepIndex + 1]!);
            }}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  error,
  keyboardType = 'default',
  maxLength,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.field}>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholder={label}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: -4,
  },
  field: {
    marginBottom: 2,
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
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
  inputError: {
    borderColor: colors.danger,
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
    borderColor: colors.text,
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
    backgroundColor: colors.text,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 14,
  },
  primaryBtnText: {
    color: colors.onAccent,
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
    borderColor: colors.text,
  },
  radioInner: {
    backgroundColor: colors.text,
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
    fontSize: 15,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  reviewTotal: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  reviewTotalValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  stepChip: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  stepChipOff: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.text,
  },
  stepChipOn: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  stepChipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  stepChipTextOff: {
    color: colors.text,
  },
  stepChipTextOn: {
    color: '#FFFFFF',
  },
  stepLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  stepLabelOn: {
    color: colors.text,
    fontWeight: '800',
  },
  stepLine: {
    backgroundColor: colors.border,
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    marginTop: 15,
  },
  stepLineOn: {
    backgroundColor: colors.text,
  },
  stepNode: {
    alignItems: 'center',
  },
  stepSegment: {
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'row',
  },
  stepSegmentEnd: {
    flex: 0,
  },
  steps: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
