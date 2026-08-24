import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/tokens';

type Props = {
  size?: number;
};

export function BrandMark({ size = 36 }: Props) {
  return (
    <View style={[styles.mark, { height: size, width: size, borderRadius: size * 0.22 }]}>
      <Text style={[styles.letter, { fontSize: size * 0.52, lineHeight: size * 0.58 }]}>N</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  letter: {
    color: colors.onAccent,
    fontWeight: '800',
  },
  mark: {
    alignItems: 'center',
    backgroundColor: colors.text,
    justifyContent: 'center',
  },
});