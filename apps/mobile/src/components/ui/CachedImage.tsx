import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import FastImage, { type FastImageProps, type Source } from 'react-native-fast-image';
import { colors } from '../../theme/tokens';

type Props = {
  uri?: string | null;
  style?: FastImageProps['style'];
  resizeMode?: keyof typeof FastImage.resizeMode;
  priority?: 'low' | 'normal' | 'high';
};

/** Warm disk/memory cache so Home banners and PLP thumbs paint faster. */
export function prefetchImages(uris: Array<string | undefined | null>, priority: Props['priority'] = 'high') {
  const sources = uris
    .map((uri) => uri?.trim())
    .filter((uri): uri is string => Boolean(uri))
    .map((uri) => ({
      uri,
      priority: FastImage.priority[priority],
    }));
  if (sources.length) {
    FastImage.preload(sources);
  }
}

/** Cached remote image — preferred over RN Image for home/PLP scroll performance. */
export function CachedImage({ uri, style, resizeMode = 'cover', priority = 'normal' }: Props) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const trimmed = uri?.trim() || '';

  useEffect(() => {
    setAttempt(0);
    setFailed(false);
  }, [trimmed]);

  const resolved = trimmed && !failed ? trimmed : null;

  if (!resolved) {
    return <View style={[styles.placeholder, style]} />;
  }

  const source: Source = {
    uri: resolved,
    priority: FastImage.priority[priority],
    // `web` revalidates; `immutable` can stick on a failed first fetch forever.
    cache: FastImage.cacheControl.web,
    headers: { Accept: 'image/*' },
  };

  return (
    <FastImage
      key={`${resolved}-${attempt}`}
      source={source}
      style={style}
      resizeMode={FastImage.resizeMode[resizeMode]}
      onError={() => {
        if (attempt < 1) {
          setAttempt((current) => current + 1);
          return;
        }
        setFailed(true);
      }}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.border,
  },
});
