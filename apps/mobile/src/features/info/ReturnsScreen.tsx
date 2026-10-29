import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import type { AuthStackParamList, RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList & AuthStackParamList>;

const POINTS = [
  {
    title: '7-day window',
    body: 'Start a return or exchange within 7 days of delivery. Items must be unused with tags on.',
  },
  {
    title: 'What we take back',
    body: 'Apparel, desk gear, and most collectibles. Limited numbered drops are final sale unless damaged.',
  },
  {
    title: 'How to start',
    body: 'Open Orders, pick the item, or Raise a query with your order number. We reply with a pickup slot.',
  },
];

export function ReturnsScreen() {
  const navigation = useNavigation<Navigation>();

  return (
    <Screen edges={[]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {POINTS.map((item) => (
          <View key={item.title} style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        ))}

        <Pressable
          style={styles.cta}
          onPress={() => navigation.navigate('RaiseQuery', { category: 'Return Related' })}
        >
          <Text style={styles.ctaText}>Raise a return query</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
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
  cta: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 12,
    marginTop: spacing.sm,
    paddingVertical: 14,
  },
  ctaText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
});
