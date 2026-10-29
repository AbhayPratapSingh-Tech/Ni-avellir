import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import type { AuthStackParamList, RootStackParamList } from '../../app/navigation/types';
import { COMPANY } from './companyInfo';

type Navigation = NativeStackNavigationProp<RootStackParamList & AuthStackParamList>;

const SECTIONS: Array<{ title: string; body: string }> = [
  {
    title: 'Who we are',
    body: `${COMPANY.name} (“Niðavellir”, “we”) runs the Niðavellir mobile shop for gaming merchandise. This policy explains what we collect in the app and API, how long we keep it, and how to reach us.`,
  },
  {
    title: 'Data we collect',
    body: 'Account: name, email, phone, password hash (never plain text), optional profile avatar URL, email verification status, Rune XP. Commerce: cart, wishlist, addresses, orders (line snapshots, totals, payment method status), cancel/return reasons. Sessions: device label, OS, IP on refresh tokens for Devices & sessions. Support: contact / raise-a-query form fields you submit. Optional: AI assistant chat text, visual-search images (processed in memory, not stored as a catalog).',
  },
  {
    title: 'Why we use it',
    body: 'To create and secure your account, fulfil orders, process payments (Razorpay), send transactional email (verify / reset / order), show personalized rails (For you), answer support queries, prevent abuse, and improve the product.',
  },
  {
    title: 'Retention',
    body: 'Account and order records are kept while your account is active and as needed for legal / tax / dispute records. OTP challenges expire via TTL. Abandoned unpaid orders may be cancelled after the pending-payment window and reserved stock is released. Session tokens can be revoked from Devices & sessions.',
  },
  {
    title: 'Deletion',
    body: 'You can remove your own reviews and clear or update profile fields in the app. Full account deletion for store compliance is planned separately. Until then, write us via Contact or Raise a query to request account closure; we will remove or anonymize personal data that is not required for legal order archives.',
  },
  {
    title: 'Avatars & review photos',
    body: 'Profile and review avatars may be uploaded so other shoppers can see them. Prefer images you have the right to share. You can change your avatar in Edit profile; authors can delete their own reviews.',
  },
  {
    title: 'Visual search',
    body: 'Camera or gallery images sent to visual search are used only to generate search keywords against the catalog. Photos are not persisted as product media or linked to your account as a photo library.',
  },
  {
    title: 'Sessions & IP',
    body: 'We store a device label, OS hint, and client IP on refresh-token sessions so you can recognize and revoke devices. IP is used for security and abuse prevention, not sold as advertising data.',
  },
  {
    title: 'Payments',
    body: 'Card / UPI checkout is handled by Razorpay. We store payment intent references and status needed to confirm orders. We never store your full card number. See Razorpay’s privacy policy for their processing.',
  },
  {
    title: 'Contact',
    body: `Questions about privacy: email ${COMPANY.email} or use Contact / Raise a query in the app. We aim to reply during ${COMPANY.hours}.`,
  },
];

export function PrivacyPolicyScreen() {
  const navigation = useNavigation<Navigation>();

  return (
    <Screen edges={[]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hero}>Privacy Policy</Text>
        <Text style={styles.heroSub}>
          How Niðavellir handles account, order, and device data in this app.
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.title}>{section.title}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}

        <Pressable style={styles.linkBtn} onPress={() => navigation.navigate('Contact')}>
          <Text style={styles.linkBtnText}>Contact us</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => navigation.navigate('RaiseQuery')}>
          <Text style={styles.secondaryBtnText}>Raise a query</Text>
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
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  hero: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroSub: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  linkBtn: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 12,
    marginTop: spacing.sm,
    paddingVertical: 14,
  },
  linkBtnText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '800',
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
    marginTop: spacing.sm,
    paddingVertical: 14,
  },
  secondaryBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
});
