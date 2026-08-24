import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';

type Props = PropsWithChildren<{
  edges?: readonly Edge[];
  style?: object;
}>;

export function Screen({ children, edges = ['top'], style }: Props) {
  return (
    <SafeAreaView style={[styles.screen, style]} edges={[...edges]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
