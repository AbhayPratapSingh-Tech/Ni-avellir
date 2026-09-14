import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../theme/tokens';

type Props = {
  listening?: boolean;
  disabled?: boolean;
  onPress: () => void;
  size?: number;
};

export function MicButton({ listening, disabled, onPress, size = 44 }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={[
        styles.btn,
        { width: size, height: size, borderRadius: size / 2 },
        listening && styles.listening,
        disabled && styles.disabled,
      ]}
      accessibilityLabel={listening ? 'Stop listening' : 'Start voice input'}
    >
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Rect
          x={9}
          y={2}
          width={6}
          height={11}
          rx={3}
          stroke={listening ? colors.onAccent : colors.accent}
          strokeWidth={2}
        />
        <Path
          d="M5 10a7 7 0 0 0 14 0"
          stroke={listening ? colors.onAccent : colors.accent}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Path
          d="M12 17v4M8 21h8"
          stroke={listening ? colors.onAccent : colors.accent}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
      {listening ? <View style={styles.pulse} /> : null}
    </Pressable>
  );
}

/** Simple chatbot robot mark for the AI hub. */
export function AssistantRobotMark({ size = 56 }: { size?: number }) {
  return (
    <View style={[styles.robotWrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <Rect x={4} y={7} width={16} height={12} rx={4} stroke={colors.accent} strokeWidth={2} />
        <Circle cx={9} cy={13} r={1.5} fill={colors.accent} />
        <Circle cx={15} cy={13} r={1.5} fill={colors.accent} />
        <Path d="M9 16.5h6" stroke={colors.accent} strokeWidth={2} strokeLinecap="round" />
        <Path d="M12 3v3M8 4h8" stroke={colors.accent} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  listening: {
    backgroundColor: colors.accent,
  },
  pulse: {
    ...StyleSheet.absoluteFillObject,
    borderColor: colors.accent,
    borderRadius: 999,
    borderWidth: 2,
    opacity: 0.35,
  },
  robotWrap: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
  },
});
