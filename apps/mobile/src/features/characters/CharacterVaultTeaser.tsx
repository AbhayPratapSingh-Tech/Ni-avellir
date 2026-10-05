import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '../../theme/tokens';
import type { RootStackParamList } from '../../app/navigation/types';
import { CHARACTER_VAULT_ROSTER } from './characterRoster';
import { CachedImage } from '../../components/ui/CachedImage';
import { preloadVaultModels } from './preloadVaultModels';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

/** Home banner under Drop Zone — opens Character Vault (Filament stays off Home scroll). */
export function CharacterVaultTeaser() {
  const navigation = useNavigation<Navigation>();
  const goku = CHARACTER_VAULT_ROSTER.find((c) => c.id === 'goku') ?? CHARACTER_VAULT_ROSTER[0]!;
  const vegeta = CHARACTER_VAULT_ROSTER.find((c) => c.id === 'vegeta');

  // Start warming as soon as Home shows the teaser (Goku first).
  useEffect(() => {
    preloadVaultModels(goku.id);
  }, [goku.id]);

  const openVault = () => {
    preloadVaultModels(goku.id);
    navigation.navigate('CharacterVault', { characterId: goku.id });
  };

  return (
    <Pressable
      style={styles.card}
      onPress={openVault}
      accessibilityRole="button"
      accessibilityLabel="Open Character Vault"
    >
      <View style={styles.artStack}>
        <CachedImage uri={goku.posterUri} style={[styles.art, styles.artBack]} priority="normal" />
        {vegeta ? (
          <CachedImage uri={vegeta.posterUri} style={[styles.art, styles.artFront]} priority="normal" />
        ) : null}
      </View>
      <View style={styles.copy}>
        <Text style={styles.kicker}>The Vault</Text>
        <Text style={styles.title}>Character Vault</Text>
        <Text style={styles.sub}>Orbit in 3D · shop their world</Text>
        <Text style={styles.cta}>Enter the vault →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  art: {
    borderRadius: 12,
    height: 104,
    width: 80,
  },
  artBack: {
    opacity: 0.75,
    position: 'absolute',
    left: 0,
    top: 8,
    transform: [{ rotate: '-6deg' }],
  },
  artFront: {
    marginLeft: 28,
    borderWidth: 2,
    borderColor: 'rgba(21,94,239,0.45)',
  },
  artStack: {
    height: 120,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    width: 120,
  },
  card: {
    backgroundColor: '#0B1020',
    borderColor: 'rgba(21,94,239,0.4)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  copy: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  cta: {
    color: '#155EEF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  kicker: {
    color: 'rgba(244,246,251,0.55)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sub: {
    color: 'rgba(168,176,194,0.9)',
    fontSize: 13,
    marginTop: 4,
  },
  title: {
    color: '#F4F6FB',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
});
