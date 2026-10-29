import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { DatePickerField } from '../../components/ui/DatePickerField';
import { useToast } from '../../components/ui/Toast';
import { useAppSelector } from '../../app/store';
import { digitsOnly } from '../../lib/addressValidation';
import { submitSupportQuery } from '../../services/support/submitSupportQuery';
import {
  createSupportQuery,
  resolveOwnerKeysForUser,
} from '../../services/support/supportQueryStore';
import type { AuthStackParamList, RootStackParamList } from '../../app/navigation/types';
import {
  emptySupportFromUser,
  validateSupportForm,
  type SupportFormState,
} from './formValidation';
import {
  EXTRA_FIELD_LABELS,
  SUPPORT_CATEGORIES,
  getCategoryConfig,
  type SupportExtraField,
} from './supportCategories';

type RaiseRoute =
  | RouteProp<RootStackParamList, 'RaiseQuery'>
  | RouteProp<AuthStackParamList, 'RaiseQuery'>;

type Navigation = NativeStackNavigationProp<RootStackParamList & AuthStackParamList>;

type PickerKind = 'category' | 'subcategory' | 'order' | null;

export function RaiseQueryScreen() {
  const toast = useToast();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<RaiseRoute>();
  const user = useAppSelector((state) => state.auth.user);
  const orders = useAppSelector((state) => state.orders.items);
  const prefCategory = route.params?.category;
  const prefOrderId = route.params?.orderId;

  const [form, setForm] = useState<SupportFormState>(() =>
    emptySupportFromUser(user, { category: prefCategory, orderId: prefOrderId }),
  );
  const [tried, setTried] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof SupportFormState, boolean>>>({});
  const [sending, setSending] = useState(false);
  const [picker, setPicker] = useState<PickerKind>(null);

  useEffect(() => {
    setForm((prev) => ({
      ...emptySupportFromUser(user, {
        category: prefCategory || prev.category,
        orderId: prefOrderId || prev.orderId,
      }),
      comments: prev.comments,
      subcategory: prev.subcategory,
      productSku: prev.productSku,
      orderDate: prev.orderDate,
      affectedProduct: prev.affectedProduct,
      paymentMode: prev.paymentMode,
      transactionId: prev.transactionId,
      paymentAmount: prev.paymentAmount,
      paymentDate: prev.paymentDate,
      awb: prev.awb,
      expectedDate: prev.expectedDate,
      deliveryAddress: prev.deliveryAddress,
      returnProduct: prev.returnProduct,
      returnRequestId: prev.returnRequestId,
      refundAmount: prev.refundAmount,
      refundReference: prev.refundReference,
      pageUrl: prev.pageUrl,
      errorMessage: prev.errorMessage,
      device: prev.device,
      couponCode: prev.couponCode,
    }));
  }, [user, prefCategory, prefOrderId]);

  const errors = useMemo(() => validateSupportForm(form), [form]);
  const showError = (key: keyof SupportFormState) =>
    (tried || touched[key]) && errors[key] ? errors[key] : undefined;

  const setField = <K extends keyof SupportFormState>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const categoryConfig = getCategoryConfig(form.category);
  const subcategories = categoryConfig?.subs ?? [];
  const loggedInOrders = !user?.isGuest && orders.length > 0;

  const selectedOrderLabel = useMemo(() => {
    if (!form.orderId) return '';
    const match = orders.find((o) => o.id === form.orderId || o.orderNumber === form.orderId);
    return match ? match.orderNumber : form.orderId;
  }, [form.orderId, orders]);

  const selectCategory = (item: string) => {
    setForm((prev) => ({
      ...prev,
      category: item,
      subcategory: '',
    }));
    setTouched((prev) => ({ ...prev, category: true, subcategory: false }));
    setPicker(null);
  };

  const submit = async () => {
    setTried(true);
    if (Object.keys(errors).length > 0) {
      toast.show('Fix the highlighted fields');
      return;
    }
    setSending(true);
    try {
      // Comments column = only what the user typed (no auto-appended extra fields).
      const comments = form.comments.trim();

      const ownerKeys = await resolveOwnerKeysForUser(user);
      const name = form.name.trim();
      const email = form.email.trim();
      const phone = digitsOnly(form.phone);
      const productSku =
        form.productSku.trim() || form.returnProduct.trim() || form.affectedProduct.trim();
      const contactKeys = [
        email ? `email:${email.toLowerCase()}` : '',
        phone ? `phone:${phone}` : '',
      ].filter(Boolean);

      // Local ticket first so we have CaseNumber + Pending for the Sheet row.
      const record = await createSupportQuery({
        ownerKeys: Array.from(new Set([...ownerKeys, ...contactKeys])),
        name,
        email,
        phone,
        category: form.category.trim(),
        subcategory: form.subcategory.trim(),
        orderId: form.orderId.trim(),
        productSku,
        comments,
      });

      await submitSupportQuery({
        name,
        email,
        phone,
        category: record.category,
        subcategory: record.subcategory,
        orderId: record.orderId,
        productSku: record.productSku,
        comments: record.comments,
        caseNumber: record.caseNumber,
        status: 'Pending',
        extras: {
          orderDate: form.orderDate.trim(),
          paymentMode: form.paymentMode.trim(),
          transactionId: form.transactionId.trim(),
          paymentAmount: form.paymentAmount.trim(),
          paymentDate: form.paymentDate.trim(),
          awb: form.awb.trim(),
          expectedDate: form.expectedDate.trim(),
          deliveryAddress: form.deliveryAddress.trim(),
          returnProduct: form.returnProduct.trim(),
          returnRequestId: form.returnRequestId.trim(),
          refundAmount: form.refundAmount.trim(),
          refundReference: form.refundReference.trim(),
          registeredMobile: digitsOnly(form.registeredMobile),
          registeredEmail: form.registeredEmail.trim(),
          errorMessage: form.errorMessage.trim(),
          device: form.device.trim(),
          couponCode: form.couponCode.trim(),
        },
      });

      setTried(false);
      setTouched({});
      setForm(emptySupportFromUser(user, { category: prefCategory, orderId: prefOrderId }));
      toast.show(`Query ${record.caseNumber} sent`);
      navigation.replace('SupportQueryDetail', { queryId: record.id });
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'Could not send query');
    } finally {
      setSending(false);
    }
  };

  const renderTextField = (
    key: keyof SupportFormState,
    label: string,
    opts?: {
      placeholder?: string;
      keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
      multiline?: boolean;
      maxLength?: number;
      phoneDigits?: boolean;
    },
  ) => (
    <View key={String(key)}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          opts?.multiline ? styles.multilineInput : null,
          showError(key) ? styles.inputError : null,
        ]}
        placeholder={opts?.placeholder || label}
        placeholderTextColor={colors.textMuted}
        value={String(form[key] || '')}
        onChangeText={(text) =>
          setField(key, opts?.phoneDigits ? digitsOnly(text).slice(0, 10) : text)
        }
        onBlur={() => setTouched((prev) => ({ ...prev, [key]: true }))}
        keyboardType={opts?.keyboardType || 'default'}
        multiline={opts?.multiline}
        textAlignVertical={opts?.multiline ? 'top' : 'center'}
        maxLength={opts?.maxLength}
        autoCapitalize={opts?.keyboardType === 'email-address' ? 'none' : 'sentences'}
        autoCorrect={opts?.keyboardType !== 'email-address'}
      />
      {showError(key) ? <Text style={styles.error}>{showError(key)}</Text> : null}
    </View>
  );

  const renderExtraFields = () => {
    if (!categoryConfig) return null;
    return categoryConfig.fields.map((field: SupportExtraField) => {
      if (field === 'order') {
        return (
          <View key="order">
            <Text style={styles.fieldLabel}>{EXTRA_FIELD_LABELS.order}</Text>
            {loggedInOrders ? (
              <Pressable style={styles.select} onPress={() => setPicker('order')}>
                <Text style={selectedOrderLabel ? styles.selectValue : styles.selectPlaceholder}>
                  {selectedOrderLabel || 'Select order'}
                </Text>
              </Pressable>
            ) : (
              <>
                {!user || user.isGuest ? (
                  <Text style={styles.hint}>Log in to pick from your orders, or type a number.</Text>
                ) : null}
                <TextInput
                  style={styles.input}
                  placeholder="e.g. ORD-XXXX"
                  placeholderTextColor={colors.textMuted}
                  value={form.orderId}
                  onChangeText={(text) => setField('orderId', text)}
                  autoCapitalize="characters"
                />
              </>
            )}
          </View>
        );
      }

      if (field === 'productSku') {
        return renderTextField('productSku', EXTRA_FIELD_LABELS.productSku, {
          placeholder: 'Product SKU',
        });
      }
      if (field === 'orderDate') {
        return (
          <DatePickerField
            key="orderDate"
            label={EXTRA_FIELD_LABELS.orderDate}
            value={form.orderDate}
            placeholder="Select order date"
            range="past"
            error={showError('orderDate')}
            onChange={(iso) => {
              setField('orderDate', iso);
              setTouched((prev) => ({ ...prev, orderDate: true }));
            }}
          />
        );
      }
      if (field === 'affectedProduct') {
        return renderTextField('affectedProduct', EXTRA_FIELD_LABELS.productSku, {
          placeholder: 'Product SKU',
        });
      }
      if (field === 'paymentMode') {
        return renderTextField('paymentMode', EXTRA_FIELD_LABELS.paymentMode, {
          placeholder: 'UPI / Card / COD',
        });
      }
      if (field === 'transactionId') {
        return renderTextField('transactionId', EXTRA_FIELD_LABELS.transactionId);
      }
      if (field === 'paymentAmount') {
        return renderTextField('paymentAmount', EXTRA_FIELD_LABELS.paymentAmount, {
          keyboardType: 'numeric',
        });
      }
      if (field === 'paymentDate') {
        return (
          <DatePickerField
            key="paymentDate"
            label={EXTRA_FIELD_LABELS.paymentDate}
            value={form.paymentDate}
            placeholder="Select payment date"
            range="past"
            error={showError('paymentDate')}
            onChange={(iso) => {
              setField('paymentDate', iso);
              setTouched((prev) => ({ ...prev, paymentDate: true }));
            }}
          />
        );
      }
      if (field === 'awb') {
        return renderTextField('awb', EXTRA_FIELD_LABELS.awb);
      }
      if (field === 'expectedDate') {
        return (
          <DatePickerField
            key="expectedDate"
            label={EXTRA_FIELD_LABELS.expectedDate}
            value={form.expectedDate}
            placeholder="Select expected date"
            range="futureAllowed"
            error={showError('expectedDate')}
            onChange={(iso) => {
              setField('expectedDate', iso);
              setTouched((prev) => ({ ...prev, expectedDate: true }));
            }}
          />
        );
      }
      if (field === 'deliveryAddress') {
        return renderTextField('deliveryAddress', EXTRA_FIELD_LABELS.deliveryAddress, {
          multiline: true,
          maxLength: 400,
        });
      }
      if (field === 'returnProduct') {
        return renderTextField('returnProduct', EXTRA_FIELD_LABELS.returnProduct);
      }
      if (field === 'returnRequestId') {
        return renderTextField('returnRequestId', EXTRA_FIELD_LABELS.returnRequestId);
      }
      if (field === 'refundAmount') {
        return renderTextField('refundAmount', EXTRA_FIELD_LABELS.refundAmount, {
          keyboardType: 'numeric',
        });
      }
      if (field === 'refundReference') {
        return renderTextField('refundReference', EXTRA_FIELD_LABELS.refundReference);
      }
      if (field === 'registeredMobile') {
        return renderTextField('registeredMobile', EXTRA_FIELD_LABELS.registeredMobile, {
          keyboardType: 'phone-pad',
          phoneDigits: true,
          maxLength: 10,
        });
      }
      if (field === 'registeredEmail') {
        return renderTextField('registeredEmail', EXTRA_FIELD_LABELS.registeredEmail, {
          keyboardType: 'email-address',
        });
      }
      if (field === 'pageUrl') {
        return renderTextField('pageUrl', EXTRA_FIELD_LABELS.pageUrl, {
          placeholder: 'e.g. Checkout / Cart / PDP',
        });
      }
      if (field === 'errorMessage') {
        return renderTextField('errorMessage', EXTRA_FIELD_LABELS.errorMessage);
      }
      if (field === 'device') {
        return renderTextField('device', EXTRA_FIELD_LABELS.device, {
          placeholder: 'e.g. iPhone 14 / Pixel 7',
        });
      }
      if (field === 'couponCode') {
        return renderTextField('couponCode', EXTRA_FIELD_LABELS.couponCode);
      }
      return null;
    });
  };

  return (
    <Screen edges={[]} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Text style={styles.heroTitle}>New query</Text>
          <Text style={styles.heroSub}>
            Share order, payment, or login details. After submit you can track status on Help &
            queries.
          </Text>

          <Text style={styles.tip}>
            {categoryConfig?.tipUpload
              ? 'Tip: For damaged or wrong items, describe the issue clearly and include order / product details (photos can be emailed to support).'
              : 'Tip: Pick the closest category and subcategory so we can route your query faster.'}
          </Text>

          {renderTextField('name', 'Name', { placeholder: 'Your full name', maxLength: 60 })}
          {renderTextField('email', 'Email', {
            placeholder: 'you@email.com',
            keyboardType: 'email-address',
          })}

          <Text style={styles.fieldLabel}>Phone</Text>
          <View style={styles.phoneRow}>
            <View style={styles.prefix}>
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              style={[styles.input, styles.phoneInput, showError('phone') ? styles.inputError : null]}
              placeholder="10-digit mobile"
              placeholderTextColor={colors.textMuted}
              value={form.phone}
              onChangeText={(text) => setField('phone', digitsOnly(text).slice(0, 10))}
              onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          {showError('phone') ? <Text style={styles.error}>{showError('phone')}</Text> : null}

          <Text style={styles.fieldLabel}>Query category</Text>
          <Pressable
            style={[styles.select, showError('category') ? styles.inputError : null]}
            onPress={() => setPicker('category')}
          >
            <Text style={form.category ? styles.selectValue : styles.selectPlaceholder}>
              {form.category || 'Select category'}
            </Text>
          </Pressable>
          {showError('category') ? <Text style={styles.error}>{showError('category')}</Text> : null}

          {subcategories.length > 0 ? (
            <>
              <Text style={styles.fieldLabel}>Subcategory</Text>
              <Pressable
                style={[styles.select, showError('subcategory') ? styles.inputError : null]}
                onPress={() => setPicker('subcategory')}
              >
                <Text style={form.subcategory ? styles.selectValue : styles.selectPlaceholder}>
                  {form.subcategory || 'Select subcategory'}
                </Text>
              </Pressable>
              {showError('subcategory') ? (
                <Text style={styles.error}>{showError('subcategory')}</Text>
              ) : null}
            </>
          ) : null}

          {renderExtraFields()}

          {renderTextField('comments', 'Comments', {
            placeholder: 'Please describe your concern',
            multiline: true,
            maxLength: 1000,
          })}

          <Pressable
            style={[styles.submitBtn, sending && styles.submitDisabled]}
            onPress={submit}
            disabled={sending}
          >
            <Text style={styles.submitText}>{sending ? 'Sending…' : 'Submit query'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={picker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPicker(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPicker(null)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {picker === 'category'
                ? 'Select category'
                : picker === 'subcategory'
                  ? 'Select subcategory'
                  : 'Select order'}
            </Text>
            <ScrollView>
              {picker === 'category'
                ? SUPPORT_CATEGORIES.map((item) => (
                    <Pressable key={item} style={styles.modalRow} onPress={() => selectCategory(item)}>
                      <Text style={styles.modalRowText}>{item}</Text>
                    </Pressable>
                  ))
                : null}
              {picker === 'subcategory'
                ? subcategories.map((item) => (
                    <Pressable
                      key={item}
                      style={styles.modalRow}
                      onPress={() => {
                        setField('subcategory', item);
                        setTouched((prev) => ({ ...prev, subcategory: true }));
                        setPicker(null);
                      }}
                    >
                      <Text style={styles.modalRowText}>{item}</Text>
                    </Pressable>
                  ))
                : null}
              {picker === 'order'
                ? orders.map((order) => (
                    <Pressable
                      key={order.id}
                      style={styles.modalRow}
                      onPress={() => {
                        setField('orderId', order.orderNumber || order.id);
                        setPicker(null);
                      }}
                    >
                      <Text style={styles.modalRowText}>{order.orderNumber}</Text>
                      <Text style={styles.modalRowMeta}>{order.status}</Text>
                    </Pressable>
                  ))
                : null}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: spacing.sm,
    marginTop: -6,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  flex: {
    flex: 1,
  },
  heroSub: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    marginBottom: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: colors.danger,
    marginBottom: 6,
  },
  modalBackdrop: {
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalRow: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  modalRowMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  modalRowText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    padding: spacing.md,
  },
  multilineInput: {
    minHeight: 90,
    paddingTop: 12,
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
  },
  phoneRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  prefix: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: spacing.sm,
    paddingHorizontal: 12,
  },
  prefixText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  select: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  selectPlaceholder: {
    color: colors.textMuted,
    fontSize: 15,
  },
  selectValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  submitBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    marginTop: spacing.sm,
    paddingVertical: 14,
  },
  submitDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '800',
  },
  tip: {
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
});
