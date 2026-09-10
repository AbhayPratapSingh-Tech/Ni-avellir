import FastImage, { type FastImageProps, type Source } from 'react-native-fast-image';

type Props = {
  uri?: string | null;
  style?: FastImageProps['style'];
  resizeMode?: keyof typeof FastImage.resizeMode;
  priority?: 'low' | 'normal' | 'high';
};

/** Cached remote image — preferred over RN Image for home/PLP scroll performance. */
export function CachedImage({ uri, style, resizeMode = 'cover', priority = 'normal' }: Props) {
  if (!uri) {
    return <FastImage style={style} />;
  }

  const source: Source = {
    uri,
    priority: FastImage.priority[priority],
    cache: FastImage.cacheControl.immutable,
  };

  return (
    <FastImage
      source={source}
      style={style}
      resizeMode={FastImage.resizeMode[resizeMode]}
    />
  );
}
