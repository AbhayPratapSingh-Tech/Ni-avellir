import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/tokens';

type Props = {
  rating: number;
  size?: number;
  onChange?: (value: number) => void;
};

export function StarRating({ rating, size = 14, onChange }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star - 0.25;
        const starNode = (
          <Text style={[styles.star, { fontSize: size, color: filled ? '#F5A524' : colors.border }]}>★</Text>
        );
        if (!onChange) {
          return <View key={star}>{starNode}</View>;
        }
        return (
          <Pressable key={star} onPress={() => onChange(star)} hitSlop={6}>
            {starNode}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  star: {
    marginRight: 1,
  },
});
