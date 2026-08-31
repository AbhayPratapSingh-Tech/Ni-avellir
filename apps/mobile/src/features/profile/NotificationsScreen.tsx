import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useToast } from '../../components/ui/Toast';
import { apiClient, getApiErrorMessage } from '../../services/api/apiClient';

type Notif = {
  _id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export function NotificationsScreen() {
  const toast = useToast();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/notifications');
      setItems(data.data.notifications ?? []);
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

  const markRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (error) {
      toast.show(getApiErrorMessage(error));
    }
  };

  const markAll = async () => {
    try {
      await apiClient.post('/notifications/read-all');
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      toast.show(getApiErrorMessage(error));
    }
  };

  return (
    <Screen edges={[]} style={styles.screen}>
      <Pressable style={styles.markAll} onPress={markAll}>
        <Text style={styles.markAllText}>Mark all read</Text>
      </Pressable>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          <Text style={styles.empty}>{loading ? 'Loading…' : 'No notifications yet'}</Text>
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !item.read && styles.unread]}
            onPress={() => {
              if (!item.read) void markRead(item._id);
            }}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  empty: { color: colors.textMuted, marginTop: spacing.xl, textAlign: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  markAll: { alignSelf: 'flex-end', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  markAllText: { color: colors.text, fontWeight: '800' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
  screen: { backgroundColor: colors.background, flex: 1 },
  title: { color: colors.text, fontSize: 15, fontWeight: '800' },
  unread: { borderColor: colors.text },
});
