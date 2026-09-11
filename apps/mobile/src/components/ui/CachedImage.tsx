import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import FastImage, { type FastImageProps, type Source } from 'react-native-fast-image';
import { colors } from '../../theme/tokens';

type Props = {
  uri?: string | null;
  style?: FastImageProps['style'];
  resizeMode?: keyof typeof FastImage.resizeMode;
  priority?: 'low' | 'normal' | 'high';
};

/** Cached remote image — preferred over RN Image for home/PLP scroll performance. */
export function CachedImage({ uri, style, resizeMode = 'cover', priority = 'normal' }: Props) {
  const [failed, setFailed] = useState(false);
  const resolved = uri?.trim() && !failed ? uri.trim() : null;

  if (!resolved) {
    return <View style={[styles.placeholder, style]} />;
  }

  const source: Source = {
    uri: resolved,
    priority: FastImage.priority[priority],
    cache: FastImage.cacheControl.immutable,
  };

  return (
    <FastImage
      source={source}
      style={style}
      resizeMode={FastImage.resizeMode[resizeMode]}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.border,
  },
});
