import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../services/api/apiClient';
import { appConfig } from '../../config/appConfig';
import {
  loyaltyRepository,
  type LoyaltyCatalogue,
} from '../../services/data/loyaltyRepository';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { updateProfile } from '../auth/authSlice';

function newKey() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatUntil(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function RuneRewardsScreen() {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [catalogue, setCatalogue] = useState<LoyaltyCatalogue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const keys = useRef<Record<string, string>>({});

  const load = useCallback(async () => {
    if (appConfig.dataSource !== 'api' || user?.isGuest) {
      setLoading(false);
      setError('');
      setCatalogue(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const next = await loyaltyRepository.catalogue();
      setCatalogue(next);
      if (next) dispatch(updateProfile({ runeXp: next.runeXp }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [dispatch, user?.isGuest]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const redeem = async (rewardId: string, title: string) => {
    const key = keys.current[rewardId] ?? newKey();
    keys.current[rewardId] = key;
    setBusyId(rewardId);
    try {
      const next = await loyaltyRepository.redeem(rewardId, key);
      delete keys.current[rewardId];
      setCatalogue(next);
      dispatch(updateProfile({ runeXp: next.runeXp }));
      toast.show(next.replayed ? `${title} already redeemed` : `${title} redeemed`);
    } catch (err) {
      const message = getApiErrorMessage(err);
      if (message.toLowerCase().includes('not enough')) {
        delete keys.current[rewardId];
      }
      toast.show(message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmRedeem = (rewardId: string, title: string, xpCost: number) => {
    Alert.alert(`Redeem ${title}?`, `This spends ${xpCost} Rune XP.`, [
      { text: 'Back', style: 'cancel' },
      { text: 'Redeem', onPress: () => void redeem(rewardId, title) },
    ]);
  };

  if (appConfig.dataSource !== 'api' || user?.isGuest) {
    return (
      <Screen edges={[]} style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Sign in to spend Rune XP</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={[]} style={styles.screen}>
      {loading && !catalogue ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error && !catalogue ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>{error}</Text>
          <Pressable style={styles.retry} onPress={() => void load()}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : catalogue ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balanceValue}>{catalogue.runeXp} XP</Text>
            {catalogue.freeShippingCredits > 0 ? (
              <Text style={styles.perkLine}>
                Free shipping credits: {catalogue.freeShippingCredits}
              </Text>
            ) : null}
            {catalogue.dropZoneEarlyUntil ? (
              <Text style={styles.perkLine}>
                Early Drop Zone until {formatUntil(catalogue.dropZoneEarlyUntil)}
              </Text>
            ) : null}
          </View>

          <Text style={styles.section}>Rewards</Text>
          {catalogue.rewards.map((reward) => {
            const busy = busyId === reward.id;
            const disabled = busy || busyId !== null || !reward.affordable;
            return (
              <View key={reward.id} style={styles.card}>
                <Text style={styles.cardTitle}>{reward.title}</Text>
                <Text style={styles.cardBody}>{reward.description}</Text>
                <View style={styles.cardRow}>
                  <Text style={styles.cost}>{reward.xpCost} XP</Text>
                  <Pressable
                    style={[styles.redeem, disabled && styles.redeemOff]}
                    disabled={disabled}
                    onPress={() => confirmRedeem(reward.id, reward.title, reward.xpCost)}
                  >
                    <Text style={styles.redeemText}>
                      {busy ? 'Redeeming…' : reward.affordable ? 'Redeem' : 'Need more XP'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          <Text style={styles.section}>Your coupons</Text>
          {catalogue.coupons.length === 0 ? (
            <Text style={styles.muted}>No unused ₹50 coupons yet.</Text>
          ) : (
            catalogue.coupons.map((coupon) => (
              <Pressable
                key={coupon.code}
                style={styles.coupon}
                onPress={() => toast.show(coupon.code)}
              >
                <Text style={styles.couponCode}>{coupon.code}</Text>
                <Text style={styles.muted}>
                  ₹{coupon.discountValue} off orders of ₹{coupon.minOrderValue}+
                  {coupon.expiresAt ? ` · until ${formatUntil(coupon.expiresAt)}` : ''}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
  },
  balanceLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  balanceValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  cardBody: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  cardRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  cost: {
    color: colors.text,
    fontWeight: '700',
  },
  coupon: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  couponCode: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  muted: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  perkLine: {
    color: colors.text,
    fontSize: 13,
    marginTop: 6,
  },
  redeem: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  redeemOff: {
    opacity: 0.45,
  },
  redeemText: {
    color: colors.onAccent,
    fontWeight: '700',
  },
  retry: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  retryText: {
    color: colors.accent,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  section: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: spacing.lg,
  },
});
