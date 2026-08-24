import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../theme/tokens';

type Props = {
  title: string;
  children: ReactNode;
};

export function Accordion({ title, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <Pressable style={styles.header} onPress={() => setOpen((value) => !value)}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.chevron}>{open ? '−' : '+'}</Text>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  chevron: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '300',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  wrap: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
});
