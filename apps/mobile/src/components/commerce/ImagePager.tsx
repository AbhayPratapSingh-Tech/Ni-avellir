import { useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { colors } from '../../theme/tokens';

type Props = {
  images: string[];
  height: number;
  width?: number;
  showCount?: boolean;
  onPressImage?: (index: number) => void;
};

export function ImagePager({ images, height, width, showCount = true, onPressImage }: Props) {
  const window = useWindowDimensions();
  const pagerWidth = width ?? window.width;
  const [index, setIndex] = useState(0);
  const data = images.length ? images : [];

  if (!data.length) {
    return <View style={[styles.frame, { height, width: pagerWidth }]} />;
  }

  return (
    <View style={{ width: pagerWidth }}>
      <FlatList
        data={data}
        keyExtractor={(item, i) => `${item}-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / pagerWidth);
          setIndex(next);
        }}
        renderItem={({ item, index: imageIndex }) => (
          <Pressable onPress={() => onPressImage?.(imageIndex)}>
            <Image source={{ uri: item }} style={{ height, width: pagerWidth }} resizeMode="cover" />
          </Pressable>
        )}
      />
      {data.length > 1 ? (
        <View style={styles.dots} pointerEvents="none">
          {data.map((item, i) => (
            <View key={`${item}-${i}`} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
      {showCount && data.length > 1 ? (
        <View style={styles.count}>
          <Text style={styles.countText}>
            {index + 1}/{data.length}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  count: {
    backgroundColor: 'rgba(10,12,18,0.55)',
    borderRadius: 10,
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: 'absolute',
  },
  countText: {
    color: colors.onAccent,
    fontSize: 11,
    fontWeight: '700',
  },
  dot: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 3,
    height: 6,
    marginHorizontal: 3,
    width: 6,
  },
  dotActive: {
    backgroundColor: colors.onAccent,
    width: 14,
  },
  dots: {
    bottom: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    width: '100%',
  },
  frame: {
    backgroundColor: colors.background,
  },
});
