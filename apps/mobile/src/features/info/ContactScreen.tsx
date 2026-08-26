import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';

export function ContactScreen() {
  return (
    <Screen edges={[]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Studio</Text>
          <Text style={styles.value}>Niðavellir Forge · Bengaluru</Text>
        </View>
        <Pressable style={styles.card} onPress={() => Linking.openURL('mailto:support@nidavellir.app')}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.link}>support@nidavellir.app</Text>
        </Pressable>
        <View style={styles.card}>
          <Text style={styles.label}>Hours</Text>
          <Text style={styles.value}>Mon–Sat, 10:00–18:00 IST</Text>
        </View>
      </ScrollView>
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  link: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  value: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
});
