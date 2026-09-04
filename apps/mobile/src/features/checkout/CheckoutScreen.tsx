import { useEffect, useMemo, useState } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { colors, spacing, typography } from '../../theme/tokens';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { clearCart } from '../cart/cartSlice';
import { addOrder } from '../orders/ordersSlice';
import { upsertAddress } from '../addresses/addressesSlice';
import { getApiErrorMessage } from '../../services/api/apiClient';
import { productRepository } from '../../services/data/productRepository';
import { openRazorpayCheckout } from '../../services/payments/openRazorpayCheckout';
import { RazorpayTestCheckout } from '../../components/commerce/RazorpayTestCheckout';
import {
  digitsOnly,
  hasAddressErrors,
  validateAddressFields,
} from '../../lib/addressValidation';
import { isLoggedInUser, requireLogin } from '../../lib/authGates';
import { goBackOrHome } from '../../lib/navigation';
import { useToast } from '../../components/ui/Toast';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const PAYMENT_METHODS = [
  { id: 'cash_on_delivery', label: 'Cash on Delivery', desc: 'Pay when it arrives' },
  {
    id: 'razorpay_demo',
    label: 'UPI / Card (Razorpay)',
    desc: 'Secure checkout via Razorpay',
  },
] as const;

type PendingRazorpay = {
  orderId: string;
  orderNumber: string;
  amountInr: number;
  amountMinor: number;
  currency: string;
  keyId: string;
  providerIntentId: string;
  demoMode: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

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

export function CheckoutScreen() {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const cart = useAppSelector((state) => state.cart);
  const user = useAppSelector((state) => state.auth.user);
  const defaultAddress = useAppSelector(
    (state) => state.addresses.items.find((item) => item.isDefault) ?? state.addresses.items[0],
  );
  const [step, setStep] = useState<Step>('Address');
  const [submitting, setSubmitting] = useState(false);
  const [triedAddress, setTriedAddress] = useState(false);
  const [razorpayPending, setRazorpayPending] = useState<PendingRazorpay | null>(null);
  const [paying, setPaying] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [payment, setPayment] = useState<string>('cash_on_delivery');

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedInUser(user)) {
        requireLogin({ user, dispatch, toast, reason: 'checkout' });
        goBackOrHome(navigation);
      }
    }, [dispatch, navigation, toast, user]),
  );

  useEffect(() => {
    if (defaultAddress) {
      setFullName((prev) => prev || defaultAddress.fullName);
      setPhone((prev) => prev || defaultAddress.phone);
      setLine1((prev) => prev || defaultAddress.line1);
      setCity((prev) => prev || defaultAddress.city);
      setStateName((prev) => prev || defaultAddress.state);
      setPostalCode((prev) => prev || defaultAddress.postalCode);
      return;
    }
    if (user && !user.isGuest) {
      setFullName((prev) => prev || user.name || '');
      setPhone((prev) => prev || digitsOnly(user.phone || ''));
    }
  }, [defaultAddress, user]);

  const addressErrors = useMemo((): AddressErrors => {
    const result = validateAddressFields({
      fullName,
      phone,
      line1,
      city,
      state: stateName,
      postalCode,
    });
    return {
      fullName: result.fullName,
      phone: result.phone,
      line1: result.line1,
      city: result.city,
      stateName: result.state,
      postalCode: result.postalCode,
    };
  }, [fullName, phone, line1, city, stateName, postalCode]);
  const addressValid = !hasAddressErrors({
    fullName: addressErrors.fullName,
    phone: addressErrors.phone,
    line1: addressErrors.line1,
    city: addressErrors.city,
    state: addressErrors.stateName,
    postalCode: addressErrors.postalCode,
  });
  const stepIndex = STEPS.indexOf(step);
  // 3-button Android nav is ~48dp; insets.bottom can be 0 with translucent bars.
  const footerPadBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 16);

  const goNextFromAddress = () => {
    setTriedAddress(true);
    if (!addressValid) return;
    setStep('Payment');
  };

  const finishOrder = (order: {
    id?: string;
    _id?: string;
    orderNumber?: string;
    status?: string;
    subtotal?: number;
    shipping?: number;
    tax?: number;
    total?: number;
    currency?: string;
    estimatedDelivery?: string;
    items?: Array<{
      productId?: string;
      name?: string;
      price?: number;
      quantity?: number;
      imageUrl?: string;
      lineTotal?: number;
    }>;
    shippingAddress?: {
      fullName?: string;
      phone?: string;
      line1?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    };
    createdAt?: string;
  }) => {
    const orderId = String(order.id ?? order._id ?? order.orderNumber);
    const shippingAddress = {
      fullName: (order.shippingAddress?.fullName ?? fullName).trim(),
      phone: digitsOnly(order.shippingAddress?.phone ?? phone),
      line1: (order.shippingAddress?.line1 ?? line1).trim(),
      city: (order.shippingAddress?.city ?? city).trim(),
      state: (order.shippingAddress?.state ?? stateName).trim(),
      postalCode: digitsOnly(order.shippingAddress?.postalCode ?? postalCode),
    };

    const lineItems =
      order.items && order.items.length > 0
        ? order.items.map((line, index) => {
            const cartLine = cart.items[index];
            return {
              productId: String(line.productId ?? cartLine?.product.id ?? index),
              name: line.name ?? cartLine?.product.name ?? 'Item',
              price: line.price ?? cartLine?.product.price ?? 0,
              quantity: line.quantity ?? cartLine?.quantity ?? 1,
              imageUrl: line.imageUrl ?? cartLine?.product.imageUrl ?? '',
              lineTotal:
                line.lineTotal ??
                cartLine?.lineTotal ??
                (line.price ?? cartLine?.product.price ?? 0) * (line.quantity ?? 1),
            };
          })
        : cart.items.map((line) => ({
            productId: line.product.id,
            name: line.product.name,
            price: line.product.price,
            quantity: line.quantity,
            imageUrl: line.product.imageUrl,
            lineTotal: line.lineTotal,
          }));

    dispatch(
      addOrder({
        id: orderId,
        orderNumber: order.orderNumber ?? orderId,
        status: order.status ?? 'confirmed',
        subtotal: order.subtotal ?? cart.subtotal,
        shipping: order.shipping ?? cart.shipping,
        tax: order.tax ?? cart.tax,
        total: order.total ?? cart.total,
        currency: order.currency ?? 'INR',
        estimatedDelivery: order.estimatedDelivery ?? '3–5 business days',
        itemCount: lineItems.reduce((sum, line) => sum + line.quantity, 0),
        createdAt: order.createdAt ?? new Date().toISOString(),
        paymentMethod: payment,
        items: lineItems,
        shippingAddress,
      }),
    );
    dispatch(upsertAddress({ ...shippingAddress, isDefault: true }));
    dispatch(clearCart());
    setRazorpayPending(null);
    navigation.replace('OrderConfirmation', { orderId: order.orderNumber ?? orderId });
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
      const email =
        user && !user.isGuest && user.email.trim()
          ? user.email.trim()
          : 'demo@nidavellir.app';
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

      if (payment === 'cash_on_delivery') {
        finishOrder(order);
        return;
      }

      const orderId = String(order.id ?? order._id);
      const intent = await productRepository.createPaymentIntent(orderId);
      const amountMinor =
        intent.amountMinor > 0
          ? intent.amountMinor
          : Math.round((order.total ?? cart.total) * 100);
      const pending: PendingRazorpay = {
        orderId,
        orderNumber: order.orderNumber ?? intent.orderNumber ?? orderId,
        amountInr: order.total ?? Math.round(amountMinor / 100),
        amountMinor,
        currency: intent.currency || 'INR',
        keyId: intent.keyId,
        providerIntentId: intent.providerIntentId,
        demoMode: intent.demoMode,
        customerName: fullName.trim(),
        customerEmail: email,
        customerPhone: digitsOnly(phone),
      };

      // Branch on intent.demoMode (see PROJECT_INSIGHTS.md):
      // true  → in-app demo sheet + /demo-complete
      // false → react-native-razorpay Checkout + /confirm
      if (pending.demoMode) {
        setRazorpayPending(pending);
        return;
      }

      await payWithNativeRazorpay(pending);
    } catch (error) {
      Alert.alert('Order failed', getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const payWithNativeRazorpay = async (pending: PendingRazorpay) => {
    setPaying(true);
    try {
      const result = await openRazorpayCheckout({
        keyId: pending.keyId,
        providerIntentId: pending.providerIntentId,
        amountMinor: pending.amountMinor,
        currency: pending.currency,
        orderNumber: pending.orderNumber,
        customerName: pending.customerName,
        customerEmail: pending.customerEmail,
        customerPhone: pending.customerPhone,
      });
      const order = await productRepository.confirmRazorpayPayment({
        orderId: pending.orderId,
        providerIntentId: result.razorpay_order_id || pending.providerIntentId,
        providerPaymentId: result.razorpay_payment_id,
        signature: result.razorpay_signature,
      });
      finishOrder({
        ...order,
        orderNumber: pending.orderNumber,
        total: pending.amountInr,
        status: order.status ?? 'paid',
      });
    } catch (error) {
      Alert.alert('Payment failed', getApiErrorMessage(error));
    } finally {
      setPaying(false);
    }
  };

  const payRazorpayDemo = async () => {
    if (!razorpayPending) return;
    setPaying(true);
    try {
      const order = await productRepository.completeRazorpayDemo(razorpayPending.orderId);
      finishOrder({
        ...order,
        orderNumber: razorpayPending.orderNumber,
        total: razorpayPending.amountInr,
        status: order.status ?? 'paid',
      });
    } catch (error) {
      Alert.alert('Payment failed', getApiErrorMessage(error));
    } finally {
      setPaying(false);
    }
  };

  const showError = (key: keyof AddressErrors) =>
    triedAddress && addressErrors[key] ? addressErrors[key] : undefined;

  return (
    <View style={styles.screen}>
      <RazorpayTestCheckout
        visible={Boolean(razorpayPending?.demoMode)}
        amountInr={razorpayPending?.amountInr ?? 0}
        orderNumber={razorpayPending?.orderNumber ?? ''}
        demoMode={razorpayPending?.demoMode ?? true}
        keyId={razorpayPending?.keyId ?? ''}
        busy={paying}
        onPay={payRazorpayDemo}
        onCancel={() => {
          if (paying) return;
          setRazorpayPending(null);
          Alert.alert(
            'Payment cancelled',
            'Order is pending payment. Retry Razorpay or place a new COD order.',
          );
        }}
      />
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
            style={[styles.primaryBtn, (submitting || paying) && styles.btnDisabled]}
            disabled={submitting || paying}
            onPress={placeOrder}
          >
            <Text style={styles.primaryBtnText}>
              {paying
                ? 'Opening Razorpay…'
                : submitting
                  ? payment === 'razorpay_demo'
                    ? 'Creating order…'
                    : 'Placing order…'
                  : `Place order · ₹${cart.total.toLocaleString('en-IN')}`}
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
