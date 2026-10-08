import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '../../theme/tokens';
import { goBackOrHome } from '../../lib/navigation';
import type { RootStackParamList } from '../../app/navigation/types';
import { CharacterOrbitViewer } from './CharacterOrbitViewer';
import {
  CHARACTER_VAULT_ROSTER,
  getVaultCharacter,
  vaultCharacterIndex,
} from './characterRoster';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CharacterVault'>;

export function CharacterVaultScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const initial = getVaultCharacter(route.params?.characterId);
  const [index, setIndex] = useState(() => vaultCharacterIndex(initial.id));
  const [ctaHovered, setCtaHovered] = useState(false);
  const character = CHARACTER_VAULT_ROSTER[index] ?? initial;

  const goPrev = () => {
    setIndex((current) => (current - 1 + CHARACTER_VAULT_ROSTER.length) % CHARACTER_VAULT_ROSTER.length);
  };
  const goNext = () => {
    setIndex((current) => (current + 1) % CHARACTER_VAULT_ROSTER.length);
  };

  const visitStore = () => {
    navigation.navigate('Products', {
      franchise: character.franchise,
      title: `${character.displayName}'s Vault`,
    });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={styles.glowTop} />
      <View style={styles.glowAccent} />

      <View style={styles.topBar}>
        <Pressable onPress={() => goBackOrHome(navigation)} style={styles.topBtn} hitSlop={12}>
          <Text style={styles.topBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.topTitle}>Character Vault</Text>
        <View style={styles.topBtn} />
      </View>

      <Text style={styles.kicker}>Find your character</Text>

      {/* flex:1 eats leftover space so the stage (and character) grow taller */}
      <View style={styles.stage}>
        <CharacterOrbitViewer character={character} />
        <Pressable style={[styles.chevron, styles.chevronLeft]} onPress={goPrev} hitSlop={12}>
          <Text style={styles.chevronText}>‹</Text>
        </Pressable>
        <Pressable style={[styles.chevron, styles.chevronRight]} onPress={goNext} hitSlop={12}>
          <Text style={styles.chevronText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.meta}>
        <Text style={styles.name}>{character.displayName}</Text>
        <Text style={styles.brand}>{character.brandLabel}</Text>
      </View>

      <View style={styles.dots}>
        {CHARACTER_VAULT_ROSTER.map((item, i) => (
          <View key={item.id} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.cta, (pressed || ctaHovered) && styles.ctaActive]}
        onHoverIn={() => setCtaHovered(true)}
        onHoverOut={() => setCtaHovered(false)}
        onPress={visitStore}
      >
        <Text style={styles.ctaText}>{`Visit ${character.displayName}'s Vault →`}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    color: 'rgba(168,176,194,0.95)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chevron: {
    alignItems: 'center',
    backgroundColor: 'rgba(11,16,32,0.55)',
    borderColor: 'rgba(244,246,251,0.12)',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    top: '42%',
    width: 44,
  },
  chevronLeft: {
    left: spacing.sm,
  },
  chevronRight: {
    right: spacing.sm,
  },
  chevronText: {
    color: '#F4F6FB',
    fontSize: 28,
    lineHeight: 30,
    marginTop: -2,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: 'rgba(244,246,251,0.22)',
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: 16,
  },
  ctaActive: {
    backgroundColor: '#155EEF',
    borderColor: '#155EEF',
  },
  ctaText: {
    color: '#F4F6FB',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dot: {
    backgroundColor: 'rgba(244,246,251,0.25)',
    borderRadius: 3,
    height: 6,
    marginHorizontal: 3,
    width: 6,
  },
  dotActive: {
    backgroundColor: '#155EEF',
    width: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  glowAccent: {
    backgroundColor: 'rgba(21,94,239,0.18)',
    borderRadius: 200,
    height: 280,
    position: 'absolute',
    right: -80,
    top: 120,
    width: 280,
  },
  glowTop: {
    backgroundColor: 'rgba(124,92,255,0.14)',
    borderRadius: 220,
    height: 320,
    left: -100,
    position: 'absolute',
    top: -40,
    width: 320,
  },
  kicker: {
    color: 'rgba(244,246,251,0.55)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  meta: {
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  name: {
    color: '#F4F6FB',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  screen: {
    backgroundColor: '#0B1020',
    flex: 1,
  },
  stage: {
    backgroundColor: 'rgba(22,16,42,0.55)',
    borderColor: 'rgba(244,246,251,0.08)',
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: spacing.md,
    minHeight: 360,
    overflow: 'hidden',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  topBtn: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  topBtnText: {
    color: '#F4F6FB',
    fontSize: 32,
    lineHeight: 34,
  },
  topTitle: {
    color: '#F4F6FB',
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
});
