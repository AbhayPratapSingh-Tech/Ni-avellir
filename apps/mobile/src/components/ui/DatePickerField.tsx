import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { colors, spacing } from '../../theme/tokens';

export type DatePickerRange = 'past' | 'futureAllowed';

type Props = {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  error?: string;
  /**
   * `past` — order/payment: today and earlier only; month nav prefers going back in time.
   * `futureAllowed` — delivery ETA: today and future (and recent past) OK.
   */
  range?: DatePickerRange;
};

function parseValue(value: string): Date | null {
  if (!value.trim()) return null;
  const parsed = parseISO(value.trim());
  return isValid(parsed) ? parsed : null;
}

function boundsForRange(range: DatePickerRange) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  if (range === 'past') {
    return {
      minimumDate: undefined as Date | undefined,
      maximumDate: todayEnd,
      hint: 'Orders & payments are in the past — future dates are disabled.',
    };
  }
  // Delivery / expected: allow future; also allow a bit of past for delayed cases.
  return {
    minimumDate: undefined as Date | undefined,
    maximumDate: undefined as Date | undefined,
    hint: 'Expected delivery can be a future date.',
  };
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  range = 'past',
}: Props) {
  const selected = parseValue(value);
  const { minimumDate, maximumDate, hint } = boundsForRange(range);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => selected || new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const openPicker = () => {
    // Past pickers open on the selected date, else today (history goes backward from here).
    setCursor(selected || new Date());
    setOpen(true);
  };

  const canGoOlder = () => {
    if (!minimumDate) return true;
    const prevMonth = startOfMonth(subMonths(cursor, 1));
    return !isBefore(endOfMonth(prevMonth), startOfDay(minimumDate));
  };

  const canGoNewer = () => {
    if (!maximumDate) return true;
    const nextMonth = startOfMonth(addMonths(cursor, 1));
    return !isAfter(nextMonth, startOfDay(maximumDate));
  };

  const goOlder = () => {
    if (!canGoOlder()) return;
    setCursor((d) => subMonths(d, 1));
  };

  const goNewer = () => {
    if (!canGoNewer()) return;
    setCursor((d) => addMonths(d, 1));
  };

  const pick = (day: Date) => {
    if (isDisabled(day)) return;
    onChange(format(day, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const isDisabled = (day: Date) => {
    const d = startOfDay(day);
    if (maximumDate && isAfter(d, startOfDay(maximumDate))) return true;
    if (minimumDate && isBefore(d, startOfDay(minimumDate))) return true;
    return false;
  };

  // Past range: reverse chevrons so › walks further into the past (order history).
  const pastMode = range === 'past';

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={[styles.select, error ? styles.selectError : null]} onPress={openPicker}>
        <Text style={selected ? styles.value : styles.placeholder}>
          {selected ? format(selected, 'dd MMM yyyy') : placeholder}
        </Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.hint}>{hint}</Text>
            <View style={styles.header}>
              <Pressable
                hitSlop={10}
                onPress={pastMode ? goNewer : goOlder}
                disabled={pastMode ? !canGoNewer() : !canGoOlder()}
              >
                <Text
                  style={[
                    styles.nav,
                    (pastMode ? !canGoNewer() : !canGoOlder()) && styles.navDisabled,
                  ]}
                >
                  ‹
                </Text>
              </Pressable>
              <Text style={styles.month}>{format(cursor, 'MMMM yyyy')}</Text>
              <Pressable
                hitSlop={10}
                onPress={pastMode ? goOlder : goNewer}
                disabled={pastMode ? !canGoOlder() : !canGoNewer()}
              >
                <Text
                  style={[
                    styles.nav,
                    (pastMode ? !canGoOlder() : !canGoNewer()) && styles.navDisabled,
                  ]}
                >
                  ›
                </Text>
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                <Text key={d} style={styles.weekDay}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {days.map((day) => {
                const inMonth = isSameMonth(day, cursor);
                const active = selected ? isSameDay(day, selected) : false;
                const disabled = isDisabled(day);
                return (
                  <Pressable
                    key={day.toISOString()}
                    style={[styles.dayCell, active && styles.dayActive]}
                    disabled={disabled}
                    onPress={() => pick(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !inMonth && styles.dayMuted,
                        active && styles.dayActiveText,
                        disabled && styles.dayDisabled,
                      ]}
                    >
                      {format(day, 'd')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actions}>
              {value ? (
                <Pressable
                  onPress={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  <Text style={styles.clear}>Clear</Text>
                </Pressable>
              ) : (
                <View />
              )}
              <Pressable onPress={() => setOpen(false)}>
                <Text style={styles.close}>Close</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  backdrop: {
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  clear: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  close: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  dayActive: {
    backgroundColor: colors.accent,
  },
  dayActiveText: {
    color: colors.onAccent,
    fontWeight: '800',
  },
  dayCell: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginVertical: 2,
    width: `${100 / 7}%`,
  },
  dayDisabled: {
    opacity: 0.35,
  },
  dayMuted: {
    color: colors.textMuted,
  },
  dayText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: spacing.sm,
    marginTop: -6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  month: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  nav: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '300',
    paddingHorizontal: 8,
  },
  navDisabled: {
    opacity: 0.25,
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: 15,
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
  selectError: {
    borderColor: colors.danger,
    marginBottom: 6,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
  },
  value: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  weekDay: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    width: `${100 / 7}%`,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
});
