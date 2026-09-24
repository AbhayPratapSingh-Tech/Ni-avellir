import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { addOrder } from '../orders/ordersSlice';
import { updateProfile } from '../auth/authSlice';
import {
  deleteAddress,
  setDefaultAddress,
  upsertAddress,
  type SavedAddress,
} from '../addresses/addressesSlice';
import { getApiErrorMessage } from '../../services/api/apiClient';
import { appConfig } from '../../config/appConfig';
import { addressRepository } from '../../services/data/addressRepository';
import { cartRepository } from '../../services/data/cartRepository';
import { productRepository } from '../../services/data/productRepository';
import { serviceabilityRepository } from '../../services/data/serviceabilityRepository';
import type { ServiceabilityDto } from '@nidavellir/shared';
import { openRazorpayCheckout } from '../../services/payments/openRazorpayCheckout';
import { RazorpayTestCheckout } from '../../components/commerce/RazorpayTestCheckout';
import {
  digitsOnly,
  hasAddressErrors,
  validateAddressFields,
  type AddressFields,
} from '../../lib/addressValidation';
import { isLoggedInUser, requireLogin } from '../../lib/authGates';
import { goBackOrHome } from '../../lib/navigation';
import { useToast } from '../../components/ui/Toast';
import { authRepository } from '../../services/data/authRepository';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

/** Prefer last 10 digits so +91 / 91-prefixed values stay valid. */
function normalizeIndianMobile(value: string) {
  const digits = digitsOnly(value);
  return digits.length > 10 ? digits.slice(-10) : digits;
}

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
  const savedAddresses = useAppSelector((state) => state.addresses.items);
  const [step, setStep] = useState<Step>('Address');
  const [submitting, setSubmitting] = useState(false);
  const [triedAddress, setTriedAddress] = useState(false);
  const [razorpayPending, setRazorpayPending] = useState<PendingRazorpay | null>(null);
  const [paying, setPaying] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressPanel, setAddressPanel] = useState<'list' | 'form'>('list');
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  /** Prevents empty→sync race from trapping checkout on the Add address form. */
  const addressFormIntentRef = useRef<'none' | 'add' | 'edit'>('none');
  const scrollRef = useRef<ScrollView>(null);
  /** Avoid flashing the blank address form while saved addresses load from API. */
  const [addressesHydrating, setAddressesHydrating] = useState(
    () => appConfig.dataSource === 'api' && savedAddresses.length === 0,
  );

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [payment, setPayment] = useState<string>('cash_on_delivery');
  const [serviceability, setServiceability] = useState<ServiceabilityDto | null>(null);
  const [serviceabilityLoading, setServiceabilityLoading] = useState(false);

  const hasSavedAddresses = savedAddresses.length > 0;
  const showAddressForm =
    !addressesHydrating && (!hasSavedAddresses || addressPanel === 'form');

  const applySavedAddress = useCallback((address: SavedAddress) => {
    setSelectedAddressId(address.id);
    setFullName(address.fullName);
    setPhone(normalizeIndianMobile(address.phone));
    setLine1(address.line1);
    setCity(address.city);
    setStateName(address.state);
    setPostalCode(digitsOnly(address.postalCode).slice(0, 6));
  }, []);

  const clearAddressFields = useCallback(() => {
    setFullName(user && !user.isGuest ? user.name || '' : '');
    setPhone(user && !user.isGuest ? normalizeIndianMobile(user.phone || '') : '');
    setLine1('');
    setCity('');
    setStateName('');
    setPostalCode('');
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedInUser(user)) {
        requireLogin({ user, dispatch, toast, reason: 'checkout' });
        goBackOrHome(navigation);
        return;
      }
      if (appConfig.dataSource !== 'api') {
        setAddressesHydrating(false);
        return;
      }
      let cancelled = false;
      // Only show a loader when we don't already have addresses in memory.
      if (savedAddresses.length === 0) {
        setAddressesHydrating(true);
      }
      void addressRepository.syncToStore().finally(() => {
        if (!cancelled) setAddressesHydrating(false);
      });
      return () => {
        cancelled = true;
      };
    }, [dispatch, navigation, savedAddresses.length, toast, user]),
  );

  useEffect(() => {
    if (addressesHydrating) return;

    if (!hasSavedAddresses) {
      addressFormIntentRef.current = 'none';
      setAddressPanel('form');
      setEditingAddressId(null);
      if (user && !user.isGuest) {
        setFullName((prev) => prev || user.name || '');
        setPhone((prev) => prev || normalizeIndianMobile(user.phone || ''));
      }
      return;
    }

    // Addresses finished syncing — leave the blank Add form unless user opened Add/Edit.
    if (addressPanel === 'form' && addressFormIntentRef.current === 'none') {
      setAddressPanel('list');
      return;
    }

    // Only sync card → fields on the Address step so Payment/Review aren't wiped mid-flow.
    if (addressPanel !== 'list' || step !== 'Address') return;

    const preferred =
      savedAddresses.find((item) => item.id === selectedAddressId) ??
      savedAddresses.find((item) => item.isDefault) ??
      savedAddresses[0];
    if (!preferred) return;

    setSelectedAddressId(preferred.id);
    setFullName(preferred.fullName);
    setPhone(normalizeIndianMobile(preferred.phone));
    setLine1(preferred.line1);
    setCity(preferred.city);
    setStateName(preferred.state);
    setPostalCode(digitsOnly(preferred.postalCode).slice(0, 6));

    if (!savedAddresses.some((item) => item.isDefault)) {
      if (appConfig.dataSource === 'api') {
        void addressRepository.setDefault(preferred.id);
      } else {
        dispatch(setDefaultAddress(preferred.id));
      }
    }
  }, [
    addressPanel,
    addressesHydrating,
    dispatch,
    hasSavedAddresses,
    savedAddresses,
    selectedAddressId,
    step,
    user,
  ]);

  const resolveShippingAddress = useCallback((): AddressFields | null => {
    if (hasSavedAddresses) {
      const chosen =
        savedAddresses.find((item) => item.id === selectedAddressId) ??
        savedAddresses.find((item) => item.isDefault) ??
        savedAddresses[0];
      if (chosen) {
        const fromCard: AddressFields = {
          fullName: chosen.fullName.trim(),
          phone: normalizeIndianMobile(chosen.phone),
          line1: chosen.line1.trim(),
          city: chosen.city.trim(),
          state: chosen.state.trim(),
          postalCode: digitsOnly(chosen.postalCode).slice(0, 6),
        };
        if (!hasAddressErrors(validateAddressFields(fromCard))) {
          return fromCard;
        }
      }
    }

    const fromForm: AddressFields = {
      fullName: fullName.trim(),
      phone: normalizeIndianMobile(phone),
      line1: line1.trim(),
      city: city.trim(),
      state: stateName.trim(),
      postalCode: digitsOnly(postalCode).slice(0, 6),
    };
    if (hasAddressErrors(validateAddressFields(fromForm))) return null;
    return fromForm;
  }, [
    fullName,
    hasSavedAddresses,
    line1,
    phone,
    postalCode,
    savedAddresses,
    selectedAddressId,
    stateName,
    city,
  ]);

  const openAddAddress = () => {
    addressFormIntentRef.current = 'add';
    setEditingAddressId(null);
    setTriedAddress(false);
    clearAddressFields();
    setAddressPanel('form');
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const openEditAddress = (address: SavedAddress) => {
    addressFormIntentRef.current = 'edit';
    setEditingAddressId(address.id);
    setTriedAddress(false);
    applySavedAddress(address);
    setAddressPanel('form');
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const cancelAddressForm = () => {
    if (!hasSavedAddresses) return;
    addressFormIntentRef.current = 'none';
    setTriedAddress(false);
    setEditingAddressId(null);
    setAddressPanel('list');
    const selected =
      savedAddresses.find((item) => item.id === selectedAddressId) ??
      savedAddresses.find((item) => item.isDefault) ??
      savedAddresses[0];
    if (selected) applySavedAddress(selected);
  };

  const makeDefaultAddress = (address: SavedAddress) => {
    if (address.isDefault) {
      toast.show('Already set as Default address');
      return;
    }
    applySavedAddress(address);
    if (appConfig.dataSource === 'api') {
      void addressRepository.setDefault(address.id).then(() => {
        toast.show('Default address updated');
      });
      return;
    }
    dispatch(setDefaultAddress(address.id));
    toast.show('Default address updated');
  };

  const confirmDeleteAddress = (address: SavedAddress) => {
    Alert.alert('Delete address', `Remove ${address.fullName}'s address?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const remaining = savedAddresses.filter((item) => item.id !== address.id);
          const next =
            remaining.find((item) => item.isDefault) ?? remaining[0] ?? null;
          if (appConfig.dataSource === 'api') {
            void addressRepository.remove(address.id).then(() => {
              if (selectedAddressId === address.id) {
                if (next) applySavedAddress(next);
                else {
                  setSelectedAddressId(null);
                  clearAddressFields();
                  setAddressPanel('form');
                }
              }
              toast.show('Address deleted');
            });
            return;
          }
          dispatch(deleteAddress(address.id));
          if (selectedAddressId === address.id) {
            if (next) applySavedAddress(next);
            else {
              setSelectedAddressId(null);
              clearAddressFields();
              setAddressPanel('form');
            }
          }
          toast.show('Address deleted');
        },
      },
    ]);
  };

  const saveAddressForm = async () => {
    setTriedAddress(true);
    if (!addressValid) {
      toast.show('Fix the highlighted address fields to save');
      return;
    }
    const payload = {
      fullName: fullName.trim(),
      phone: digitsOnly(phone),
      line1: line1.trim(),
      city: city.trim(),
      state: stateName.trim(),
      postalCode: digitsOnly(postalCode),
      ...(editingAddressId ? {} : { isDefault: savedAddresses.length === 0 }),
    };
    setSavingAddress(true);
    try {
      if (appConfig.dataSource === 'api') {
        if (editingAddressId) {
          await addressRepository.update(editingAddressId, payload);
          applySavedAddress({ id: editingAddressId, ...payload });
        } else {
          const created = await addressRepository.create(payload);
          applySavedAddress(created);
        }
      } else {
        const id = editingAddressId ?? `addr_${Date.now()}`;
        dispatch(upsertAddress({ id, ...payload }));
        applySavedAddress({ id, ...payload });
      }
      toast.show(editingAddressId ? 'Address updated' : 'Address saved');
      addressFormIntentRef.current = 'none';
      setEditingAddressId(null);
      setTriedAddress(false);
      setAddressPanel('list');
    } catch (error) {
      toast.show(authRepository.getApiErrorMessage(error));
    } finally {
      setSavingAddress(false);
    }
  };

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

  useEffect(() => {
    const pin = digitsOnly(postalCode).slice(0, 6);
    if (pin.length !== 6) {
      setServiceability(null);
      return;
    }
    let alive = true;
    setServiceabilityLoading(true);
    void serviceabilityRepository.check(pin).then((result) => {
      if (!alive) return;
      setServiceability(result);
      setServiceabilityLoading(false);
      if (!result.codAvailable && payment === 'cash_on_delivery') {
        setPayment('razorpay_demo');
      }
      void cartRepository.refresh(pin).catch(() => undefined);
    });
    return () => {
      alive = false;
    };
  }, [postalCode]);

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
    if (showAddressForm && hasSavedAddresses) {
      toast.show('Save or cancel the address form to continue');
      return;
    }

    const shipping = resolveShippingAddress();
    if (!shipping) {
      setTriedAddress(true);
      toast.show(
        hasSavedAddresses
          ? 'This address is incomplete — tap Edit to fix it'
          : 'Fix the highlighted address fields to continue',
      );
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setFullName(shipping.fullName);
    setPhone(shipping.phone);
    setLine1(shipping.line1);
    setCity(shipping.city);
    setStateName(shipping.state);
    setPostalCode(shipping.postalCode);
    setTriedAddress(false);
    if (serviceability && !serviceability.serviceable) {
      toast.show('We cannot deliver to this pincode yet');
      return;
    }
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
    awardedXp?: number;
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
    // Clear server cart + Redux so refresh/bootstrap don't restore purchased lines.
    void cartRepository.clear();
    // Pull updated Rune XP after COD / paid order.
    void authRepository.me().then((next) => {
      if (!next) return;
      dispatch(
        updateProfile({
          name: next.name,
          email: next.email,
          phone: next.phone,
          avatarUri: next.avatarUrl ?? null,
          runeXp: next.runeXp,
        }),
      );
    });
    setRazorpayPending(null);
    navigation.replace('OrderConfirmation', {
      orderId: order.orderNumber ?? orderId,
      awardedXp: order.awardedXp ?? 100,
    });
  };

  const placeOrder = async () => {
    const shipping = resolveShippingAddress();
    if (!shipping) {
      toast.show('Shipping address is incomplete — update it to place the order');
      setStep('Address');
      setTriedAddress(true);
      if (!hasSavedAddresses) setAddressPanel('form');
      return;
    }

    setFullName(shipping.fullName);
    setPhone(shipping.phone);
    setLine1(shipping.line1);
    setCity(shipping.city);
    setStateName(shipping.state);
    setPostalCode(shipping.postalCode);

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
        customer: { name: shipping.fullName, email, phone: shipping.phone },
        items: itemInputs,
        shippingAddress: {
          fullName: shipping.fullName,
          phone: shipping.phone,
          line1: shipping.line1,
          city: shipping.city,
          state: shipping.state,
          postalCode: shipping.postalCode,
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
        customerName: shipping.fullName,
        customerEmail: email,
        customerPhone: shipping.phone,
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
        ref={scrollRef}
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'Address' ? (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {showAddressForm
                  ? editingAddressId
                    ? 'Edit address'
                    : hasSavedAddresses
                      ? 'Add address'
                      : 'Shipping address'
                  : 'Shipping address'}
              </Text>
              {hasSavedAddresses && !showAddressForm ? (
                <Pressable style={styles.addAddressBtn} onPress={openAddAddress}>
                  <Text style={styles.addAddressBtnText}>＋ Add address</Text>
                </Pressable>
              ) : null}
            </View>

            {addressesHydrating ? (
              <View style={styles.addressLoading}>
                <ActivityIndicator color={colors.text} />
                <Text style={styles.addressLoadingText}>Loading saved addresses…</Text>
              </View>
            ) : !showAddressForm ? (
              <View style={styles.savedBlock}>
                <Text style={styles.savedLabel}>Saved addresses — tap to use</Text>
                {savedAddresses.map((address) => {
                  const selected =
                    selectedAddressId === address.id ||
                    (!selectedAddressId && Boolean(address.isDefault));
                  return (
                    <View
                      key={address.id}
                      style={[styles.savedCard, selected && styles.savedCardOn]}
                    >
                      <Pressable onPress={() => applySavedAddress(address)}>
                        <View style={styles.savedCardTop}>
                          <Text style={styles.savedName}>{address.fullName}</Text>
                          {address.isDefault ? (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultBadgeText}>Default address</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.savedLine} numberOfLines={2}>
                          {address.line1}, {address.city}, {address.state} {address.postalCode}
                        </Text>
                        <Text style={styles.savedLine}>Phone {address.phone}</Text>
                      </Pressable>
                      <View style={styles.cardActions}>
                        {!address.isDefault ? (
                          <Pressable onPress={() => makeDefaultAddress(address)} hitSlop={8}>
                            <Text style={styles.cardAction}>Set as default</Text>
                          </Pressable>
                        ) : (
                          <Text style={styles.cardActionMuted}>Using for checkout</Text>
                        )}
                        <View style={styles.cardActionsRight}>
                          <Pressable onPress={() => openEditAddress(address)} hitSlop={8}>
                            <Text style={styles.cardAction}>Edit</Text>
                          </Pressable>
                          <Pressable onPress={() => confirmDeleteAddress(address)} hitSlop={8}>
                            <Text style={[styles.cardAction, styles.cardActionDanger]}>Delete</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View>
                {triedAddress && !addressValid ? (
                  <Text style={styles.formBanner}>
                    Continue needs a valid Indian name, 10-digit mobile (6–9…), full street, city,
                    state, and 6-digit PIN.
                  </Text>
                ) : null}

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

                {hasSavedAddresses ? (
                  <View style={styles.formActions}>
                    <Pressable
                      style={styles.formCancelBtn}
                      onPress={cancelAddressForm}
                      disabled={savingAddress}
                    >
                      <Text style={styles.formCancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.formSaveBtn, savingAddress && styles.btnDisabled]}
                      onPress={() => {
                        void saveAddressForm();
                      }}
                      disabled={savingAddress}
                    >
                      <Text style={styles.formSaveText}>
                        {savingAddress
                          ? 'Saving…'
                          : editingAddressId
                            ? 'Save changes'
                            : 'Save address'}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            )}

            {digitsOnly(postalCode).length === 6 ? (
              <View
                style={[
                  styles.serviceCard,
                  serviceability && !serviceability.serviceable && styles.serviceCardBad,
                ]}
              >
                {serviceabilityLoading || !serviceability ? (
                  <Text style={styles.serviceText}>Checking delivery for {postalCode}…</Text>
                ) : serviceability.serviceable ? (
                  <>
                    <Text style={styles.serviceTitle}>Deliverable to {serviceability.pincode}</Text>
                    <Text style={styles.serviceText}>
                      ETA ~{serviceability.etaDays} days · Shipping ₹{serviceability.shippingCharge}
                      {serviceability.freeShippingThreshold
                        ? ` (free above ₹${serviceability.freeShippingThreshold})`
                        : ''}
                    </Text>
                    <Text style={styles.serviceText}>
                      COD {serviceability.codAvailable ? 'available' : 'not available'} for this pin
                    </Text>
                  </>
                ) : (
                  <Text style={styles.serviceTextBad}>
                    Not serviceable for pincode {serviceability.pincode}
                  </Text>
                )}
              </View>
            ) : null}
          </View>
        ) : null}

        {step === 'Payment' ? (
          <View>
            <Text style={styles.sectionTitle}>Payment method</Text>
            {PAYMENT_METHODS.filter(
              (m) => m.id !== 'cash_on_delivery' || serviceability?.codAvailable !== false,
            ).map((m) => (
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
  serviceCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  serviceCardBad: {
    backgroundColor: 'rgba(196,92,92,0.15)',
  },
  serviceText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  serviceTextBad: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  serviceTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
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
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    marginRight: spacing.sm,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  addAddressBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.text,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addAddressBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  cardActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  cardActionsRight: {
    flexDirection: 'row',
  },
  cardAction: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: spacing.md,
  },
  cardActionDanger: {
    color: colors.danger,
  },
  cardActionMuted: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  savedCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  defaultBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  defaultBadgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  formActions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  formCancelBtn: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    marginRight: spacing.sm,
    paddingVertical: 12,
  },
  formCancelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  formSaveBtn: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 12,
    flex: 1.4,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  formSaveText: {
    color: colors.onAccent,
    fontSize: 14,
    fontWeight: '800',
  },
  formBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  savedBlock: {
    marginBottom: spacing.md,
  },
  addressLoading: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.md,
    minHeight: 120,
    padding: spacing.lg,
  },
  addressLoadingText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  savedCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  savedCardOn: {
    borderColor: colors.text,
    borderWidth: 2,
  },
  savedLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  savedLine: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  savedName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
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
