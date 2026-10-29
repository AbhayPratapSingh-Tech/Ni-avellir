import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useAppSelector } from '../../app/store';
import type { AuthStackParamList, RootStackParamList } from '../../app/navigation/types';
import {
  listSupportQueriesForUser,
  statusLabel,
  type SupportQueryRecord,
} from '../../services/support/supportQueryStore';

type Navigation = NativeStackNavigationProp<RootStackParamList & AuthStackParamList>;

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SupportScreen() {
  const navigation = useNavigation<Navigation>();
  const user = useAppSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [queries, setQueries] = useState<SupportQueryRecord[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await listSupportQueriesForUser(user);
      setQueries(items);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openCount = queries.filter((q) => q.status === 'open').length;

  return (
    <Screen edges={[]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heroTitle}>Your queries</Text>
        <Text style={styles.heroSub}>
          Track tickets you raised from this device. Pending ones stay visible until you mark them
          resolved.
        </Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : null}

        {!loading && queries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No queries yet</Text>
            <Text style={styles.emptyBody}>
              When you raise a concern about an order, payment, or login, it will show up here with
              its status.
            </Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('RaiseQuery')}
            >
              <Text style={styles.primaryBtnText}>Raise a query</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && queries.length > 0 ? (
          <>
            <Text style={styles.summary}>
              {queries.length} total · {openCount} pending
            </Text>
            {queries.map((item) => (
              <Pressable
                key={item.id}
                style={styles.card}
                onPress={() => navigation.navigate('SupportQueryDetail', { queryId: item.id })}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.caseNumber}>{item.caseNumber}</Text>
                  <View
                    style={[
                      styles.badge,
                      item.status === 'resolved' ? styles.badgeResolved : styles.badgeOpen,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        item.status === 'resolved' ? styles.badgeTextResolved : null,
                      ]}
                    >
                      {statusLabel(item.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.category} numberOfLines={1}>
                  {item.category}
                  {item.subcategory ? ` · ${item.subcategory}` : ''}
                </Text>
                <Text style={styles.preview} numberOfLines={2}>
                  {item.comments}
                </Text>
                <Text style={styles.meta}>{formatWhen(item.createdAt)}</Text>
              </Pressable>
            ))}
          </>
        ) : null}
      </ScrollView>

      {!loading && queries.length > 0 ? (
        <View style={styles.footer}>
          <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('RaiseQuery')}>
            <Text style={styles.primaryBtnText}>Raise a query</Text>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeOpen: {
    backgroundColor: colors.accentSoft,
  },
  badgeResolved: {
    backgroundColor: colors.border,
  },
  badgeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  badgeTextResolved: {
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  caseNumber: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  category: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  centered: {
    paddingVertical: spacing.xl,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  footer: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: spacing.md,
  },
  heroSub: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  preview: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
  },
  primaryBtnText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  summary: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
});
