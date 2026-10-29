import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import type { AuthStackParamList, RootStackParamList } from '../../app/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList & AuthStackParamList>;

const FAQS = [
  {
    q: 'How long does shipping take?',
    a: 'Most orders leave the forge in 1–2 business days. Metro cities usually arrive in 3–5 days.',
  },
  {
    q: 'Do you ship COD?',
    a: 'Yes. Cash on Delivery is available at checkout alongside UPI / card.',
  },
  {
    q: 'Are sizes true to fit?',
    a: 'Apparel is listed with fit notes on the product page. Size swaps are handled within the return window.',
  },
  {
    q: 'Is this official merch?',
    a: 'Items are fan-inspired studio drops unless marked as a licensed brand on the product card.',
  },
];

export function FaqScreen() {
  const navigation = useNavigation<Navigation>();

  return (
    <Screen edges={[]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {FAQS.map((item) => (
          <View key={item.q} style={styles.card}>
            <Text style={styles.q}>{item.q}</Text>
            <Text style={styles.a}>{item.a}</Text>
          </View>
        ))}

        <Pressable onPress={() => navigation.navigate('Support')} style={styles.helpWrap}>
          <Text style={styles.help}>
            Still stuck? <Text style={styles.helpStrong}>Open Help & queries</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  a: {
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
  help: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  helpStrong: {
    color: colors.text,
    fontWeight: '800',
  },
  helpWrap: {
    marginTop: spacing.sm,
  },
  q: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
