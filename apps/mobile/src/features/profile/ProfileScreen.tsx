import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../theme/tokens';
import { useAppSelector } from '../../app/store';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const MENU = [
  { key: 'orders', label: 'My Orders', icon: '📦' },
  { key: 'addresses', label: 'Addresses', icon: '📍' },
  { key: 'notifications', label: 'Notifications', icon: '🔔' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
  { key: 'support', label: 'Support', icon: '💬' },
] as const;

export function ProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const itemCount = useAppSelector((state) => state.cart.itemCount);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>N</Text>
        </View>
        <View>
          <Text style={styles.name}>Niðavellir Forge</Text>
          <Text style={styles.email}>demo@nidavellir.app</Text>
        </View>
      </View>

      <View style={styles.xpCard}>
        <Text style={styles.xpTitle}>⚒︎ Rune XP</Text>
        <View style={styles.xpBar}>
          <View style={styles.xpFill} />
        </View>
        <Text style={styles.xpLabel}>Apprentice · 120 / 500 XP</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{itemCount}</Text>
          <Text style={styles.statLabel}>Cart items</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>120</Text>
          <Text style={styles.statLabel}>XP</Text>
        </View>
      </View>

      <View style={styles.menu}>
        {MENU.map((item) => (
          <Pressable
            key={item.key}
            style={styles.menuRow}
            onPress={() => {
              if (item.key === 'orders') navigation.navigate('Orders');
            }}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuChevron}>›</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.footer}>Niðavellir v0.1.0 · College Final Semester Project</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 60,
  },
  avatarText: {
    color: '#07130D',
    fontSize: 26,
    fontWeight: '800',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  email: {
    color: colors.textMuted,
    fontSize: 13,
  },
  footer: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  menu: {
    marginTop: spacing.lg,
  },
  menuChevron: {
    color: colors.textMuted,
    fontSize: 22,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  menuLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  menuRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 14,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  stats: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  xpBar: {
    backgroundColor: colors.background,
    borderRadius: 6,
    height: 8,
    marginVertical: spacing.sm,
    overflow: 'hidden',
    width: '100%',
  },
  xpCard: {
    backgroundColor: 'rgba(46,242,167,0.1)',
    borderColor: colors.accent,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
  },
  xpFill: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    height: 8,
    width: '24%',
  },
  xpLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  xpTitle: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },
});
