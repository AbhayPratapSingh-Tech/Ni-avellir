import { Image } from 'react-native';

type Props = {
  /** Image height in dp. Width is derived from the 3:1 stacked wordmark ratio. */
  height?: number;
  /**
   * `light` = wordmark for light UI backgrounds (default).
   * `dark` = wordmark for dark / photo overlays.
   */
  tone?: 'light' | 'dark';
};

const WORDMARK_LIGHT = require('../../../assets/brand/wordmark/nidavellir-stacked-transparent-for-light-600w.png');
const WORDMARK_DARK = require('../../../assets/brand/wordmark/nidavellir-stacked-transparent-for-dark-600w.png');

/** Stacked lockup is 1200×400 (3:1). */
const ASPECT = 3;

export function BrandMark({ height = 40, tone = 'light' }: Props) {
  const width = height * ASPECT;
  return (
    <Image
      source={tone === 'dark' ? WORDMARK_DARK : WORDMARK_LIGHT}
      style={{ height, width }}
      resizeMode="contain"
      accessibilityLabel="Niðavellir"
    />
  );
}
