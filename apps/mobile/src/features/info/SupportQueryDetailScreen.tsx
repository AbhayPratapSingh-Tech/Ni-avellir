import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useToast } from '../../components/ui/Toast';
import type { AuthStackParamList, RootStackParamList } from '../../app/navigation/types';
import {
  getSupportQueryById,
  markSupportQueryResolved,
  statusLabel,
  type SupportQueryRecord,
} from '../../services/support/supportQueryStore';
import { resolveSupportQueryOnSheet } from '../../services/support/submitSupportQuery';

type Navigation = NativeStackNavigationProp<RootStackParamList & AuthStackParamList>;
type Route =
  | RouteProp<RootStackParamList, 'SupportQueryDetail'>
  | RouteProp<AuthStackParamList, 'SupportQueryDetail'>;

function formatWhen(iso?: string) {
  if (!iso) return '—';
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

export function SupportQueryDetailScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState<SupportQueryRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const item = await getSupportQueryById(route.params.queryId);
      setQuery(item);
    } finally {
      setLoading(false);
    }
  }, [route.params.queryId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const markResolved = () => {
    if (!query || query.status === 'resolved') return;
    Alert.alert(
      'Mark as resolved?',
      'Use this when your issue is fixed. You can still raise a new query later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Resolved',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                try {
                  await resolveSupportQueryOnSheet({
                    caseNumber: query.caseNumber,
                    email: query.email,
                    phone: query.phone,
                  });
                } catch (sheetError) {
                  toast.show(
                    sheetError instanceof Error
                      ? sheetError.message
                      : 'Sheet update failed — status still saved on device',
                  );
                }
                const next = await markSupportQueryResolved(query.id);
                if (!next) {
                  toast.show('Query not found');
                  return;
                }
                setQuery(next);
                toast.show('Marked as Resolved');
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <Screen edges={[]} style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    );
  }

  if (!query) {
    return (
      <Screen edges={[]} style={styles.screen}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Query not found</Text>
          <Pressable style={styles.secondaryBtn} onPress={() => navigation.navigate('Support')}>
            <Text style={styles.secondaryBtnText}>Back to queries</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={[]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.caseNumber}>{query.caseNumber}</Text>
          <View
            style={[
              styles.badge,
              query.status === 'resolved' ? styles.badgeResolved : styles.badgeOpen,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                query.status === 'resolved' ? styles.badgeTextResolved : null,
              ]}
            >
              {statusLabel(query.status)}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Category</Text>
          <Text style={styles.value}>{query.category}</Text>
          {query.subcategory ? (
            <>
              <Text style={styles.label}>Subcategory</Text>
              <Text style={styles.value}>{query.subcategory}</Text>
            </>
          ) : null}
          {query.orderId ? (
            <>
              <Text style={styles.label}>Order</Text>
              <Text style={styles.value}>{query.orderId}</Text>
            </>
          ) : null}
          {query.productSku ? (
            <>
              <Text style={styles.label}>Product SKU</Text>
              <Text style={styles.value}>{query.productSku}</Text>
            </>
          ) : null}
          <Text style={styles.label}>Comments</Text>
          <Text style={styles.comments}>{query.comments}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Contact</Text>
          <Text style={styles.value}>
            {query.name}
            {'\n'}
            {query.email}
            {'\n'}
            +91 {query.phone}
          </Text>
          <Text style={styles.label}>Created</Text>
          <Text style={styles.value}>{formatWhen(query.createdAt)}</Text>
          {query.resolvedAt ? (
            <>
              <Text style={styles.label}>Resolved</Text>
              <Text style={styles.value}>{formatWhen(query.resolvedAt)}</Text>
            </>
          ) : null}
        </View>

        {query.status === 'open' ? (
          <Pressable
            style={[styles.primaryBtn, busy && styles.disabled]}
            onPress={markResolved}
            disabled={busy}
          >
            <Text style={styles.primaryBtnText}>{busy ? 'Updating…' : 'Mark Resolved'}</Text>
          </Pressable>
        ) : (
          <View style={styles.resolvedNote}>
            <Text style={styles.resolvedNoteText}>
              This query is resolved. Need more help? Raise a new query.
            </Text>
            <Pressable style={styles.secondaryBtn} onPress={() => navigation.navigate('RaiseQuery')}>
              <Text style={styles.secondaryBtnText}>Raise a query</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
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
  caseNumber: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  comments: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  disabled: {
    opacity: 0.65,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    marginTop: spacing.sm,
    paddingVertical: 14,
  },
  primaryBtnText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '800',
  },
  resolvedNote: {
    marginTop: spacing.sm,
  },
  resolvedNoteText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  secondaryBtn: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  secondaryBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  value: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
});
