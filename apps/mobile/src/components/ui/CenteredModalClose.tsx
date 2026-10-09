import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/tokens';

/** Space above the card so `top: -20` on the close control stays visible. */
export const centeredModalCloseOffset = 20;

type Props = {
  onPress: () => void;
};

export function CenteredModalClose({ onPress }: Props) {
  return (
    <Pressable
      style={styles.close}
      onPress={onPress}
      hitSlop={12}
      accessibilityLabel="Close"
    >
      <Text style={styles.glyph}>✕</Text>
    </Pressable>
  );
}

/** Wrapper that leaves room for the floating close on a centered card. */
export function CenteredModalShell({ children }: { children: ReactNode }) {
  return (
    <View style={styles.shell} pointerEvents="box-none">
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  close: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 4,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
    top: -20,
    width: 32,
    zIndex: 10,
  },
  glyph: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  shell: {
    flexShrink: 1,
    overflow: 'visible',
    paddingTop: centeredModalCloseOffset,
  },
});
