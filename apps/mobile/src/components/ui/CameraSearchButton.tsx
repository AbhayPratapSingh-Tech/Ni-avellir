import { Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../theme/tokens';

type Props = {
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  size?: number;
};

export function CameraSearchButton({ onPress, disabled, busy, size = 40 }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      hitSlop={8}
      style={[
        styles.btn,
        { width: size, height: size, borderRadius: size / 2 },
        busy && styles.busy,
        (disabled || busy) && styles.disabled,
      ]}
      accessibilityLabel={busy ? 'Searching by photo' : 'Search by photo'}
    >
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1.1-1.6A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.2.4L16.3 6h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
          stroke={busy ? colors.onAccent : colors.accent}
          strokeWidth={2}
        />
        <Circle
          cx={12}
          cy={12.5}
          r={3.2}
          stroke={busy ? colors.onAccent : colors.accent}
          strokeWidth={2}
        />
        <Rect x={0} y={0} width={24} height={24} fill="transparent" />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    justifyContent: 'center',
    marginLeft: 8,
  },
  busy: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  disabled: {
    opacity: 0.55,
  },
});
