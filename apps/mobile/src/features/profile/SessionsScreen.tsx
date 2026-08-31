import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useToast } from '../../components/ui/Toast';
import { apiClient, getApiErrorMessage } from '../../services/api/apiClient';

type Session = {
  id: string;
  deviceId?: string;
  createdAt: string;
  expiresAt: string;
};

export function SessionsScreen() {
  const toast = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/auth/sessions');
      setSessions(data.data.sessions ?? []);
    } catch (error) {
      toast.show(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const revoke = async (id: string) => {
    try {
      await apiClient.delete(`/auth/sessions/${id}`);
      toast.show('Session revoked');
      await load();
    } catch (error) {
      toast.show(getApiErrorMessage(error));
    }
  };

  return (
    <Screen edges={[]} style={styles.screen}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          <Text style={styles.empty}>{loading ? 'Loading…' : 'No active sessions'}</Text>
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.deviceId || 'This device / session'}</Text>
            <Text style={styles.meta}>Created {new Date(item.createdAt).toLocaleString()}</Text>
            <Text style={styles.meta}>Expires {new Date(item.expiresAt).toLocaleString()}</Text>
            <Pressable style={styles.revoke} onPress={() => revoke(item.id)}>
              <Text style={styles.revokeText}>Revoke</Text>
            </Pressable>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  empty: { color: colors.textMuted, marginTop: spacing.xl, textAlign: 'center' },
  list: { padding: spacing.lg },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  revoke: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: 6,
  },
  revokeText: { color: colors.danger, fontWeight: '800' },
  screen: { backgroundColor: colors.background, flex: 1 },
  title: { color: colors.text, fontSize: 15, fontWeight: '800' },
});
