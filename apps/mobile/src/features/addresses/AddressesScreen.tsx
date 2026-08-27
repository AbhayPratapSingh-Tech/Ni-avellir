import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useAppDispatch, useAppSelector } from '../../app/store';
import {
  digitsOnly,
  hasAddressErrors,
  validateAddressFields,
  type AddressFields,
} from '../../lib/addressValidation';
import {
  deleteAddress,
  setDefaultAddress,
  upsertAddress,
  type SavedAddress,
} from './addressesSlice';

type FormState = AddressFields & { id?: string };

const emptyForm: FormState = {
  fullName: '',
  phone: '',
  line1: '',
  city: '',
  state: '',
  postalCode: '',
};

const FIELD_META: Array<{
  key: keyof AddressFields;
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad';
  maxLength?: number;
  autoCapitalize?: 'words' | 'sentences' | 'none';
}> = [
  {
    key: 'fullName',
    label: 'Full name',
    placeholder: 'e.g. Aarav Sharma',
    autoCapitalize: 'words',
    maxLength: 60,
  },
  {
    key: 'phone',
    label: 'Phone',
    placeholder: '10-digit mobile',
    keyboardType: 'number-pad',
    maxLength: 10,
  },
  {
    key: 'line1',
    label: 'Address line',
    placeholder: 'House no, street, landmark',
    autoCapitalize: 'sentences',
    maxLength: 120,
  },
  {
    key: 'city',
    label: 'City',
    placeholder: 'e.g. Bengaluru',
    autoCapitalize: 'words',
    maxLength: 50,
  },
  {
    key: 'state',
    label: 'State',
    placeholder: 'e.g. Karnataka',
    autoCapitalize: 'words',
    maxLength: 50,
  },
  {
    key: 'postalCode',
    label: 'PIN code',
    placeholder: '6-digit PIN',
    keyboardType: 'number-pad',
    maxLength: 6,
  },
];

export function AddressesScreen() {
  const dispatch = useAppDispatch();
  const addresses = useAppSelector((state) => state.addresses.items);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [tried, setTried] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof AddressFields, boolean>>>({});

  const errors = useMemo(
    () =>
      validateAddressFields({
        fullName: form.fullName,
        phone: form.phone,
        line1: form.line1,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
      }),
    [form],
  );
  const editing = Boolean(form.id);

  const showError = (key: keyof AddressFields) =>
    (tried || touched[key]) && errors[key] ? errors[key] : undefined;

  const openAdd = () => {
    setForm(emptyForm);
    setTried(false);
    setTouched({});
    setFormOpen(true);
  };

  const openEdit = (address: SavedAddress) => {
    setForm({
      id: address.id,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
    });
    setTried(false);
    setTouched({});
    setFormOpen(true);
  };

  const save = () => {
    setTried(true);
    if (hasAddressErrors(errors)) return;
    dispatch(
      upsertAddress({
        id: form.id,
        fullName: form.fullName.trim(),
        phone: digitsOnly(form.phone),
        line1: form.line1.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: digitsOnly(form.postalCode),
        ...(form.id ? {} : { isDefault: addresses.length === 0 }),
      }),
    );
    setFormOpen(false);
  };

  const confirmDelete = (address: SavedAddress) => {
    Alert.alert('Delete address', `Remove ${address.fullName}'s address?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch(deleteAddress(address.id)),
      },
    ]);
  };

  return (
    <Screen edges={[]} style={styles.screen}>
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={addresses.length === 0 ? styles.emptyContent : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📍</Text>
            <Text style={styles.emptyTitle}>No addresses yet</Text>
            <Text style={styles.emptySub}>
              Add a delivery address for faster checkout. Addresses from placed orders are saved
              here automatically.
            </Text>
            <Pressable style={styles.cta} onPress={openAdd}>
              <Text style={styles.ctaText}>Add address</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.name}>{item.fullName}</Text>
              {item.isDefault ? (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.line}>{item.line1}</Text>
            <Text style={styles.line}>
              {item.city}, {item.state} {item.postalCode}
            </Text>
            <Text style={styles.line}>Phone {item.phone}</Text>
            <View style={styles.actions}>
              {!item.isDefault ? (
                <Pressable onPress={() => dispatch(setDefaultAddress(item.id))}>
                  <Text style={styles.actionLink}>Set default</Text>
                </Pressable>
              ) : (
                <View />
              )}
              <View style={styles.actionRight}>
                <Pressable onPress={() => openEdit(item)}>
                  <Text style={styles.actionLink}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => confirmDelete(item)}>
                  <Text style={[styles.actionLink, styles.deleteLink]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      {addresses.length > 0 ? (
        <Pressable style={styles.fab} onPress={openAdd}>
          <Text style={styles.fabText}>+ Add address</Text>
        </Pressable>
      ) : null}

      <Modal
        visible={formOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setFormOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{editing ? 'Update address' : 'Add address'}</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              {FIELD_META.map((field) => {
                const error = showError(field.key);
                return (
                  <View key={field.key} style={styles.field}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <TextInput
                      style={[styles.input, error ? styles.inputError : null]}
                      value={form[field.key]}
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize={field.autoCapitalize ?? 'sentences'}
                      autoCorrect={false}
                      keyboardType={field.keyboardType ?? 'default'}
                      maxLength={field.maxLength}
                      onBlur={() => setTouched((prev) => ({ ...prev, [field.key]: true }))}
                      onChangeText={(text) =>
                        setForm((prev) => ({
                          ...prev,
                          [field.key]:
                            field.key === 'phone' || field.key === 'postalCode'
                              ? digitsOnly(text)
                              : text,
                        }))
                      }
                    />
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                  </View>
                );
              })}
              {tried && hasAddressErrors(errors) ? (
                <Text style={styles.formHint}>Fix the highlighted fields to save.</Text>
              ) : null}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setFormOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, tried && hasAddressErrors(errors) && styles.saveBtnDisabled]}
                onPress={save}
              >
                <Text style={styles.saveText}>{editing ? 'Save changes' : 'Save address'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionLink: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: spacing.md,
  },
  actionRight: {
    flexDirection: 'row',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    marginRight: spacing.sm,
    paddingVertical: 12,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
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
  defaultBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  defaultText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  deleteLink: {
    color: colors.danger,
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
  error: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
  fab: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    margin: spacing.md,
    paddingVertical: 14,
  },
  fabText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '800',
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  formHint: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputError: {
    borderColor: colors.danger,
  },
  line: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  modalBackdrop: {
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  name: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    marginRight: spacing.sm,
  },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    flex: 1.4,
    paddingVertical: 12,
  },
  saveBtnDisabled: {
    opacity: 0.75,
  },
  saveText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
