import { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/tokens';

type Props = {
  min: number;
  max: number;
  low: number;
  high: number;
  onChange: (next: { low: number; high: number }) => void;
};

const THUMB = 24;
const TRACK_H = 4;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function snap(n: number, min: number, max: number) {
  if (max - min <= 100) return Math.round(n);
  if (max - min <= 1000) return Math.round(n / 10) * 10;
  return Math.round(n / 50) * 50;
}

export function PriceRangeSlider({ min, max, low, high, onChange }: Props) {
  const [width, setWidth] = useState(0);
  const span = Math.max(1, max - min);
  const lowRef = useRef(low);
  const highRef = useRef(high);
  const widthRef = useRef(0);
  const startLowRef = useRef(low);
  const startHighRef = useRef(high);
  lowRef.current = low;
  highRef.current = high;
  widthRef.current = width;

  const lowX = useMemo(
    () => (width <= 0 ? 0 : ((low - min) / span) * width),
    [low, min, span, width],
  );
  const highX = useMemo(
    () => (width <= 0 ? 0 : ((high - min) / span) * width),
    [high, min, span, width],
  );

  const lowPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startLowRef.current = lowRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        const w = widthRef.current;
        if (w <= 0) return;
        const startX = ((startLowRef.current - min) / span) * w;
        const maxX = ((highRef.current - min) / span) * w;
        const nextX = clamp(startX + gesture.dx, 0, maxX);
        const raw = min + (nextX / w) * span;
        const nextLow = clamp(snap(raw, min, max), min, highRef.current);
        onChange({ low: nextLow, high: highRef.current });
      },
    }),
  ).current;

  const highPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startHighRef.current = highRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        const w = widthRef.current;
        if (w <= 0) return;
        const startX = ((startHighRef.current - min) / span) * w;
        const minX = ((lowRef.current - min) / span) * w;
        const nextX = clamp(startX + gesture.dx, minX, w);
        const raw = min + (nextX / w) * span;
        const nextHigh = clamp(snap(raw, min, max), lowRef.current, max);
        onChange({ low: lowRef.current, high: nextHigh });
      },
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <View style={styles.track} />
      {width > 0 ? (
        <View
          style={[
            styles.fill,
            {
              left: lowX,
              width: Math.max(TRACK_H, highX - lowX),
            },
          ]}
        />
      ) : null}
      {width > 0 ? (
        <>
          <View
            style={[styles.thumb, { left: lowX - THUMB / 2 }]}
            {...lowPan.panHandlers}
            accessibilityRole="adjustable"
            accessibilityLabel="Minimum price"
          />
          <View
            style={[styles.thumb, { left: highX - THUMB / 2 }]}
            {...highPan.panHandlers}
            accessibilityRole="adjustable"
            accessibilityLabel="Maximum price"
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    backgroundColor: colors.accent,
    borderRadius: 2,
    height: TRACK_H,
    position: 'absolute',
    top: (THUMB - TRACK_H) / 2,
  },
  thumb: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderRadius: THUMB / 2,
    borderWidth: 2.5,
    elevation: 3,
    height: THUMB,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    top: 0,
    width: THUMB,
    zIndex: 2,
  },
  track: {
    backgroundColor: colors.border,
    borderRadius: 2,
    height: TRACK_H,
    left: 0,
    position: 'absolute',
    right: 0,
    top: (THUMB - TRACK_H) / 2,
  },
  wrap: {
    height: THUMB,
    justifyContent: 'center',
    marginVertical: 4,
    width: '100%',
  },
});
