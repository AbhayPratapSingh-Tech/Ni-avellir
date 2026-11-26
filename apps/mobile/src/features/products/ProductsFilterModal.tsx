import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CatalogFilterOptions, CatalogSortOption } from '@nidavellir/shared';
import { colors, spacing } from '../../theme/tokens';
import { PriceRangeSlider } from './PriceRangeSlider';

export type PlpFilterDraft = {
  sort: CatalogSortOption['value'];
  /** Inclusive bounds; full catalog range means “no price filter”. */
  minPrice: number;
  maxPrice: number;
  franchise?: string;
  minRating: number;
  inStockOnly: boolean;
};

export const DEFAULT_PLP_SORT: CatalogSortOption['value'] = 'newest';

type Props = {
  visible: boolean;
  options: CatalogFilterOptions | null;
  value: PlpFilterDraft;
  onClose: () => void;
  onApply: (next: PlpFilterDraft) => void;
  onClear: () => void;
};

const FRANCHISE_PREVIEW = 5;

function formatInr(n: number) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function countActiveFilters(
  draft: PlpFilterDraft,
  bounds: { min: number; max: number },
): number {
  let count = 0;
  if (draft.sort !== DEFAULT_PLP_SORT) count += 1;
  if (draft.minPrice > bounds.min || draft.maxPrice < bounds.max) count += 1;
  if (draft.franchise) count += 1;
  if (draft.minRating > 0) count += 1;
  if (draft.inStockOnly) count += 1;
  return count;
}

function SortIcon({ kind, active }: { kind: CatalogSortOption['value']; active: boolean }) {
  const color = active ? colors.accent : colors.textMuted;
  if (kind === 'price_asc') {
    return <Text style={[styles.glyph, { color }]}>↑</Text>;
  }
  if (kind === 'price_desc') {
    return <Text style={[styles.glyph, { color }]}>↓</Text>;
  }
  if (kind === 'newest') {
    return <Text style={[styles.glyph, { color }]}>★</Text>;
  }
  return <Text style={[styles.glyph, { color }]}>⇅</Text>;
}

function Chip({
  label,
  active,
  onPress,
  icon,
  solid,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: ReactNode;
  /** Filled blue (franchise selected). */
  solid?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.chip,
        active && !solid && styles.chipActiveSoft,
        active && solid && styles.chipActiveSolid,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {icon}
      <Text
        style={[
          styles.chipText,
          active && !solid && styles.chipTextActiveSoft,
          active && solid && styles.chipTextActiveSolid,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ProductsFilterModal({
  visible,
  options,
  value,
  onClose,
  onApply,
  onClear,
}: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<PlpFilterDraft>(value);
  const [franchiseExpanded, setFranchiseExpanded] = useState(false);

  const priceMin = options?.priceMin ?? 0;
  const priceMax = Math.max(priceMin, options?.priceMax ?? 0);

  useEffect(() => {
    if (!visible) return;
    setDraft(value);
    setFranchiseExpanded(false);
  }, [visible, value]);

  const sorts = options?.sorts ?? [];
  const ratings = options?.ratings ?? [];
  const franchises = options?.franchises ?? [];
  const visibleFranchises = franchiseExpanded
    ? franchises
    : franchises.slice(0, FRANCHISE_PREVIEW);
  const canSeeAll = franchises.length > FRANCHISE_PREVIEW;

  const activeCount = useMemo(
    () => countActiveFilters(draft, { min: priceMin, max: priceMax }),
    [draft, priceMin, priceMax],
  );

  const resetDraft = () => {
    setDraft({
      sort: DEFAULT_PLP_SORT,
      minPrice: priceMin,
      maxPrice: priceMax,
      franchise: undefined,
      minRating: 0,
      inStockOnly: false,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss" />
        <View
          style={[
            styles.sheet,
            {
              maxHeight: height * 0.9,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.filterIcon}>
                <Text style={styles.filterIconGlyph}>☰</Text>
              </View>
              <Text style={styles.title}>Filters</Text>
              {activeCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{activeCount}</Text>
                </View>
              ) : null}
            </View>
            <Pressable
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={10}
              accessibilityLabel="Close"
            >
              <Text style={styles.closeGlyph}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.sectionHead}>
              <Text style={styles.section}>Sort By</Text>
              {draft.sort !== DEFAULT_PLP_SORT ? (
                <Pressable
                  onPress={() => setDraft((d) => ({ ...d, sort: DEFAULT_PLP_SORT }))}
                  hitSlop={8}
                >
                  <Text style={styles.link}>Clear</Text>
                </Pressable>
              ) : null}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {sorts.map((option) => {
                const active = draft.sort === option.value;
                return (
                  <Chip
                    key={option.value}
                    label={option.label}
                    active={active}
                    icon={<SortIcon kind={option.value} active={active} />}
                    onPress={() => setDraft((d) => ({ ...d, sort: option.value }))}
                  />
                );
              })}
            </ScrollView>

            <Text style={styles.section}>Price</Text>
            {priceMax > priceMin ? (
              <>
                <View style={styles.priceLabels}>
                  <Text style={styles.priceValue}>{formatInr(draft.minPrice)}</Text>
                  <Text style={styles.priceValue}>{formatInr(draft.maxPrice)}</Text>
                </View>
                <PriceRangeSlider
                  min={priceMin}
                  max={priceMax}
                  low={Math.min(Math.max(draft.minPrice, priceMin), priceMax)}
                  high={Math.min(Math.max(draft.maxPrice, priceMin), priceMax)}
                  onChange={({ low, high }) =>
                    setDraft((d) => ({ ...d, minPrice: low, maxPrice: high }))
                  }
                />
              </>
            ) : (
              <Text style={styles.priceHint}>
                {options ? 'Price range unavailable' : 'Loading price range…'}
              </Text>
            )}

            <View style={styles.sectionHead}>
              <Text style={styles.section}>Franchise</Text>
              {canSeeAll ? (
                <Pressable onPress={() => setFranchiseExpanded((v) => !v)} hitSlop={8}>
                  <Text style={styles.link}>
                    {franchiseExpanded ? 'Show less' : 'See All ›'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.wrap}>
              <Chip
                label="Any"
                active={!draft.franchise}
                solid={!draft.franchise}
                onPress={() => setDraft((d) => ({ ...d, franchise: undefined }))}
              />
              {visibleFranchises.map((name) => (
                <Chip
                  key={name}
                  label={name}
                  active={draft.franchise === name}
                  solid={draft.franchise === name}
                  onPress={() => setDraft((d) => ({ ...d, franchise: name }))}
                />
              ))}
            </View>

            <Text style={styles.section}>Rating</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {ratings.map((option) => {
                const active = draft.minRating === option.value;
                return (
                  <Chip
                    key={String(option.value)}
                    label={option.label}
                    active={active}
                    icon={
                      <Text
                        style={[
                          styles.glyph,
                          { color: active ? colors.accent : colors.textMuted },
                        ]}
                      >
                        ★
                      </Text>
                    }
                    onPress={() => setDraft((d) => ({ ...d, minRating: option.value }))}
                  />
                );
              })}
            </ScrollView>

            <View style={styles.stockRow}>
              <View style={styles.stockCopy}>
                <Text style={styles.stockTitle}>In Stock Only</Text>
                <Text style={styles.stockHint}>Show available items only</Text>
              </View>
              <Switch
                value={draft.inStockOnly}
                onValueChange={(inStockOnly) => setDraft((d) => ({ ...d, inStockOnly }))}
                trackColor={{ false: '#D1D5DB', true: colors.accent }}
                thumbColor={colors.surface}
                ios_backgroundColor="#D1D5DB"
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={styles.clearBtn}
              onPress={() => {
                resetDraft();
                onClear();
              }}
            >
              <Text style={styles.clearText}>Clear All</Text>
            </Pressable>
            <Pressable
              style={styles.applyBtn}
              onPress={() => {
                onApply(draft);
                onClose();
              }}
            >
              <Text style={styles.applyText}>
                {activeCount > 0 ? `Show Results (${activeCount})` : 'Show Results'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  applyBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
    flex: 1.35,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 14,
  },
  applyText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '800',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    marginLeft: 8,
    minWidth: 20,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: colors.onAccent,
    fontSize: 11,
    fontWeight: '800',
  },
  body: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.sm,
    marginRight: spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipActiveSoft: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  chipActiveSolid: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipRow: {
    alignItems: 'center',
    paddingRight: spacing.sm,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActiveSoft: {
    color: colors.text,
    fontWeight: '800',
  },
  chipTextActiveSolid: {
    color: colors.onAccent,
    fontWeight: '800',
  },
  clearBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  clearText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  closeBtn: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  closeGlyph: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  filterIcon: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginRight: 10,
    width: 36,
  },
  filterIconGlyph: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  glyph: {
    fontSize: 13,
    fontWeight: '700',
  },
  handle: {
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    height: 4,
    width: 40,
  },
  handleWrap: {
    alignItems: 'center',
    paddingBottom: 4,
    paddingTop: spacing.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
  },
  link: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  priceHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  priceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  section: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    elevation: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  stockCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  stockHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  stockRow: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  stockTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
