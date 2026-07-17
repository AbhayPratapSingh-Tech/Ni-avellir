import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CurrencyCode } from '@nidavellir/shared/types';
import { colors, spacing, typography } from '../../theme/tokens';

export function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Premium gaming merchandise</Text>
        <Text style={styles.title}>Niðavellir</Text>
        <Text style={styles.subtitle}>
          Physical products first, built for India with global currency support in{' '}
          {CurrencyCode.INR} and {CurrencyCode.USD}.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.lg,
  },
  hero: {
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  kicker: {
    color: colors.accent,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
  },
  title: {
    color: colors.text,
    fontSize: typography.hero,
    fontWeight: '800',
  },
});
