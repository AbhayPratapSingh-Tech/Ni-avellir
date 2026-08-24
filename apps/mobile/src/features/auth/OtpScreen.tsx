import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { colors, spacing } from '../../theme/tokens';
import { Screen } from '../../components/ui/Screen';
import { useAppDispatch } from '../../app/store';
import { signIn } from './authSlice';
import { useToast } from '../../components/ui/Toast';
import type { AuthStackParamList } from '../../app/navigation/types';

export function OtpScreen() {
  const route = useRoute<RouteProp<AuthStackParamList, 'Otp'>>();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { name, email, phone } = route.params;
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);

  const submit = () => {
    if (otp.join('').length < 4) {
      toast.show('Enter the 4-digit OTP');
      return;
    }
    dispatch(signIn({ name, email, phone }));
  };

  return (
    <Screen edges={[]} style={styles.screen}>
      <Text style={styles.sub}>We sent a code to {phone || email}. Use any 4 digits for this demo.</Text>
      <View style={styles.row}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(node) => {
              inputs.current[index] = node;
            }}
            style={styles.box}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(value) => {
              const next = [...otp];
              next[index] = value.replace(/\D/g, '').slice(-1);
              setOtp(next);
              if (next[index] && index < 3) {
                inputs.current[index + 1]?.focus();
              }
            }}
          />
        ))}
      </View>
      <Pressable style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]} onPress={submit}>
        {({ pressed }) => (
          <Text style={[styles.ctaText, pressed && styles.ctaTextPressed]}>Verify & continue</Text>
        )}
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    height: 56,
    textAlign: 'center',
    width: 56,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 12,
    marginTop: spacing.xl,
    paddingVertical: 14,
  },
  ctaPressed: {
    backgroundColor: colors.accent,
  },
  ctaText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '800',
  },
  ctaTextPressed: {
    color: colors.onAccent,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sub: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
