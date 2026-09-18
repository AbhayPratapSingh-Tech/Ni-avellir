import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { CouponOffer } from '@nidavellir/shared';
import { colors, spacing } from '../../theme/tokens';
import { couponRepository } from '../../services/data/couponRepository';
import { formatInr } from '../../lib/productMedia';

type Props = {
  visible: boolean;
  busy?: boolean;
  onClose: () => void;
  /** Applies the code (full flow). */
  onApply: (code: string) => Promise<void> | void;
  /** Fills parent cart field only. */
  onCodeFill?: (code: string) => void;
};

function offerBlurb(offer: CouponOffer) {
  if (offer.description?.trim()) return offer.description.trim();
  if (offer.discountType === 'percent') {
    return `${offer.code}: Get ${offer.discountValue}% off on Cart value ${formatInr(offer.minOrderValue)} and above.`;
  }
  return `${offer.code}: Get ${formatInr(offer.discountValue)} off on Cart value ${formatInr(offer.minOrderValue)} and above.`;
}

export function CouponOffersModal({ visible, busy, onClose, onApply, onCodeFill }: Props) {
  const [offers, setOffers] = useState<CouponOffer[]>([]);
  const [loading, setLoading] = useState(false);
  /** Code in the apply field — must not filter/hide other offer cards. */
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyingCode, setApplyingCode] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setCode('');
    setApplyingCode(null);
    setLoading(true);
    void couponRepository
      .listAvailable()
      .then(setOffers)
      .finally(() => setLoading(false));
  }, [visible]);

  const fillCode = (next: string) => {
    const trimmed = next.trim().toUpperCase();
    setCode(trimmed);
    onCodeFill?.(trimmed);
  };

  const applyCode = async (raw: string) => {
    const trimmed = raw.trim().toUpperCase();
    if (!trimmed || applying || busy) return;
    fillCode(trimmed);
    setApplying(true);
    setApplyingCode(trimmed);
    try {
      await onApply(trimmed);
    } finally {
      setApplying(false);
      setApplyingCode(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Have a coupon?</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close coupons">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter coupon code"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              value={code}
              onChangeText={(text) => {
                const next = text.toUpperCase();
                setCode(next);
                onCodeFill?.(next);
              }}
              editable={!applying && !busy}
            />
            <Pressable
              style={styles.applyTextBtn}
              disabled={applying || busy}
              onPress={() => void applyCode(code)}
            >
              <Text style={styles.applyTextBtnLabel}>Apply Coupon</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Available offers</Text>

          {loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.md }} />
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            >
              {offers.length === 0 ? (
                <Text style={styles.empty}>No offers available right now.</Text>
              ) : (
                offers.map((offer) => {
                  const isThisApplying = applyingCode === offer.code.toUpperCase();
                  const isSelected = code.trim().toUpperCase() === offer.code.toUpperCase();
                  return (
                    <View
                      key={offer.id || offer.code}
                      style={[
                        styles.card,
                        isSelected && styles.cardSelected,
                        isThisApplying && styles.cardBusy,
                      ]}
                    >
                      <Pressable
                        style={styles.cardMain}
                        disabled={applying || busy}
                        onPress={() => fillCode(offer.code)}
                      >
                        <View style={styles.percentBadge}>
                          <Text style={styles.percentGlyph}>%</Text>
                        </View>
                        <View style={styles.cardCopy}>
                          <Text style={styles.cardCode}>{offer.code}</Text>
                          <Text style={styles.cardDesc} numberOfLines={3}>
                            {offerBlurb(offer)}
                          </Text>
                        </View>
                      </Pressable>
                      <Pressable
                        style={styles.cardApply}
                        disabled={applying || busy}
                        onPress={() => void applyCode(offer.code)}
                      >
                        {isThisApplying ? (
                          <ActivityIndicator color="#8B4513" size="small" />
                        ) : (
                          <Text style={styles.cardApplyText}>Apply</Text>
                        )}
                      </Pressable>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  applyTextBtn: {
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  applyTextBtnLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  backdrop: {
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  cardBusy: {
    opacity: 0.75,
  },
  cardSelected: {
    borderColor: colors.accent,
  },
  cardMain: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginRight: spacing.sm,
  },
  cardApply: {
    alignItems: 'center',
    borderColor: '#C9A227',
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 34,
    minWidth: 64,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cardApplyText: {
    color: '#8B4513',
    fontSize: 13,
    fontWeight: '800',
  },
  cardCode: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardCopy: {
    flex: 1,
  },
  cardDesc: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  close: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  list: {
    maxHeight: 420,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  percentBadge: {
    alignItems: 'center',
    borderColor: '#C4A484',
    borderRadius: 18,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    height: 36,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 36,
  },
  percentGlyph: {
    color: '#B8860B',
    fontSize: 16,
    fontWeight: '800',
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },
  searchRow: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '88%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
});
