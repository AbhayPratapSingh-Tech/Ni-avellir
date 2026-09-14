import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Tts from 'react-native-tts';
import { colors, spacing } from '../../theme/tokens';

type Props = {
  transcript: string;
  durationMs: number;
};

function formatDuration(ms: number) {
  const total = Math.max(1, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function VoiceMessageBubble({ transcript, durationMs }: Props) {
  const [playing, setPlaying] = useState(false);
  const bars = [8, 14, 10, 18, 12, 16, 9, 15, 11, 17];

  const onPlay = () => {
    if (playing) {
      void Tts.stop();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    void Tts.stop().then(() => {
      Tts.speak(transcript);
    });
    const onFinish = () => setPlaying(false);
    Tts.addEventListener('tts-finish', onFinish);
  };

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.bubble} onPress={onPlay}>
        <View style={styles.play}>
          <Text style={styles.playIcon}>{playing ? '❚❚' : '▶'}</Text>
        </View>
        <View style={styles.wave}>
          {bars.map((h, i) => (
            <View key={i} style={[styles.bar, { height: h }]} />
          ))}
        </View>
        <Text style={styles.duration}>{formatDuration(durationMs)}</Text>
      </Pressable>
      <Text style={styles.transcript} numberOfLines={2}>
        {transcript}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.onAccent,
    borderRadius: 2,
    opacity: 0.9,
    width: 3,
  },
  bubble: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  duration: {
    color: colors.onAccent,
    fontSize: 12,
    fontWeight: '700',
  },
  play: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  playIcon: {
    color: colors.onAccent,
    fontSize: 11,
    fontWeight: '800',
  },
  transcript: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    maxWidth: 260,
  },
  wave: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 3,
    height: 20,
  },
  wrap: {
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
});
