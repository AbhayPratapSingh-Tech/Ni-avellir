import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/tokens';

type Props = {
  size?: number;
};

/**
 * Set to `true` after replacing `apps/mobile/assets/brand/logo.png` with the real mark.
 * Until then we show the letter-N fallback (avoids the placeholder square in the header).
 */
const USE_BRAND_LOGO_PNG = false;

// Keep require so flipping the flag does not need a new Metro path — file must exist.
const logoSource = require('../../../assets/brand/logo.png');

export function BrandMark({ size = 36 }: Props) {
  if (USE_BRAND_LOGO_PNG) {
    return (
      <Image
        source={logoSource}
        style={{ height: size, width: size, borderRadius: size * 0.22 }}
        resizeMode="contain"
        accessibilityLabel="Niðavellir"
      />
    );
  }

  return (
    <View style={[styles.mark, { height: size, width: size, borderRadius: size * 0.22 }]}>
      <Text style={[styles.letter, { fontSize: size * 0.52, lineHeight: size * 0.58 }]}>N</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  letter: {
    color: colors.onAccent,
    fontWeight: '800',
  },
  mark: {
    alignItems: 'center',
    backgroundColor: colors.text,
    justifyContent: 'center',
  },
});
