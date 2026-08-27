import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/tokens';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { Screen } from '../../components/ui/Screen';
import { openLogin, signOutAndClearSession } from '../auth/authSlice';
import type { RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const MENU = [
  { key: 'edit', label: 'Edit profile', icon: '✎' },
  { key: 'orders', label: 'My Orders', icon: '📦' },
  { key: 'addresses', label: 'Addresses', icon: '📍' },
  { key: 'notifications', label: 'Notifications', icon: '🔔' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
  { key: 'support', label: 'Support', icon: '💬' },
] as const;

export function ProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const dispatch = useAppDispatch();
  const itemCount = useAppSelector((state) => state.cart.itemCount);
  const orderCount = useAppSelector((state) => state.orders.items.length);
  const user = useAppSelector((state) => state.auth.user);
  const displayName = user?.isGuest ? 'Guest' : user?.name || 'Niðavellir Forge';
  const displayEmail = user?.isGuest
    ? 'Browsing as guest'
    : user?.email || user?.phone || 'demo@nidavellir.app';
  const initial = displayName.charAt(0).toUpperCase();

  const openEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  return (
    <Screen>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={openEditProfile} style={styles.avatarWrap}>
            {user?.avatarUri ? (
              <Image source={{ uri: user.avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{displayEmail}</Text>
            {!user?.isGuest && user?.phone ? (
              <Text style={styles.phone}>{user.phone}</Text>
            ) : null}
          </View>
          <Pressable style={styles.editChip} onPress={openEditProfile} hitSlop={8}>
            <Text style={styles.editChipText}>Edit</Text>
          </Pressable>
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
            <Text style={styles.statValue}>{orderCount}</Text>
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
                if (item.key === 'edit') {
                  openEditProfile();
                  return;
                }
                if (item.key === 'orders') {
                  navigation.navigate('Orders');
                  return;
                }
                if (item.key === 'addresses') {
                  navigation.navigate('Addresses');
                  return;
                }
                if (item.key === 'support') {
                  navigation.navigate('Support');
                }
              }}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuChevron}>›</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}
          onPress={() => dispatch(user?.isGuest ? openLogin() : signOutAndClearSession())}
        >
          <Text style={user?.isGuest ? styles.loginText : styles.logoutText}>
            {user?.isGuest ? 'Login / Signup' : 'Log out'}
          </Text>
        </Pressable>

        <Text style={styles.footer}>Niðavellir v0.1.0 · College Final Semester Project</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  avatarImage: {
    borderRadius: 30,
    height: 60,
    width: 60,
  },
  avatarText: {
    color: colors.onAccent,
    fontSize: 26,
    fontWeight: '800',
  },
  avatarWrap: {
    marginRight: spacing.md,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  editChip: {
    backgroundColor: colors.accentSoft,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  email: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
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
  headerCopy: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  logout: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: spacing.lg,
    paddingVertical: 14,
  },
  logoutPressed: {
    backgroundColor: colors.accentSoft,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '800',
  },
  loginText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
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
  phone: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
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
    backgroundColor: colors.accentSoft,
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
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
});
