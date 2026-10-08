import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  Animator,
  Camera,
  EnvironmentalLight,
  FilamentScene,
  FilamentView,
  Light,
  ModelRenderer,
  useCameraManipulator,
  useModel,
} from 'react-native-filament';
import { colors } from '../../theme/tokens';
import { CHARACTER_VAULT_ROSTER, type VaultCharacter } from './characterRoster';

type Props = {
  character: VaultCharacter;
};

/**
 * `useModel` reports loaded before IBL + GPU draws finish — character pops in ~1s later.
 * Hold the spinner that long after decode so it clears with the mesh, not before.
 */
const VISIBLE_AFTER_DECODE_MS = 1200;
/** Already-decoded swap (◀/▶) only needs a short beat for addToScene. */
const VISIBLE_AFTER_SWAP_MS = 180;

function RosterModel({
  item,
  active,
  alreadyReady,
  onReady,
}: {
  item: VaultCharacter;
  active: boolean;
  alreadyReady: boolean;
  onReady: (id: string) => void;
}) {
  const model = useModel(item.modelSource, { addToScene: active });
  const hadDecodedRef = useRef(false);

  useEffect(() => {
    if (!active || model.state !== 'loaded') return;
    if (alreadyReady) {
      onReady(item.id);
      return;
    }

    const firstDecode = !hadDecodedRef.current;
    hadDecodedRef.current = true;
    const delay = firstDecode ? VISIBLE_AFTER_DECODE_MS : VISIBLE_AFTER_SWAP_MS;
    const timer = setTimeout(() => onReady(item.id), delay);
    return () => clearTimeout(timer);
  }, [active, alreadyReady, item.id, model.state, onReady]);

  return (
    <ModelRenderer
      model={model}
      transformToUnitCube
      scale={item.displayScale}
      translate={item.translate}
    >
      {item.enableIdleAnimation && active ? (
        <Animator
          animationIndex={item.idleAnimationIndex}
          transitionDuration={0.25}
        />
      ) : null}
    </ModelRenderer>
  );
}

function OrbitScene({
  character,
  viewHeight,
  readyIds,
  onReady,
}: {
  character: VaultCharacter;
  viewHeight: number;
  readyIds: Set<string>;
  onReady: (id: string) => void;
}) {
  const [mountedIds, setMountedIds] = useState<string[]>(() => [character.id]);

  useEffect(() => {
    setMountedIds((ids) => (ids.includes(character.id) ? ids : [...ids, character.id]));
  }, [character.id]);

  const cameraManipulator = useCameraManipulator({
    orbitHomePosition: [0, 0.65, 4.15],
    targetPosition: [0, 0.4, 0],
    orbitSpeed: [0.003, 0.003],
  });

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin((event) => {
          'worklet';
          const yCorrected = viewHeight - event.y;
          cameraManipulator?.grabBegin(event.x, yCorrected, false);
        })
        .onUpdate((event) => {
          'worklet';
          const yCorrected = viewHeight - event.y;
          cameraManipulator?.grabUpdate(event.x, yCorrected);
        })
        .onEnd(() => {
          'worklet';
          cameraManipulator?.grabEnd();
        }),
    [cameraManipulator, viewHeight],
  );

  return (
    <GestureDetector gesture={panGesture}>
      <FilamentView style={styles.filament}>
        <EnvironmentalLight source={{ uri: 'RNF_default_env_ibl.ktx' }} intensity={28_000} />
        <Light
          type="directional"
          intensity={55_000}
          colorKelvin={6500}
          direction={[0.35, -1, -0.55]}
          castShadows={false}
        />
        {CHARACTER_VAULT_ROSTER.filter((item) => mountedIds.includes(item.id)).map((item) => (
          <RosterModel
            key={item.id}
            item={item}
            active={item.id === character.id}
            alreadyReady={readyIds.has(item.id)}
            onReady={onReady}
          />
        ))}
        <Camera cameraManipulator={cameraManipulator} />
      </FilamentView>
    </GestureDetector>
  );
}

/** Lobby-style 3D stage — one FilamentScene for the vault visit; swap via character prop. */
export function CharacterOrbitViewer({ character }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const [viewHeight, setViewHeight] = useState(() => Math.max(360, Math.round(windowHeight * 0.5)));
  const [readyIds, setReadyIds] = useState<Set<string>>(() => new Set());

  const onReady = useCallback((id: string) => {
    setReadyIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const showLoader = !readyIds.has(character.id);

  return (
    <View
      style={styles.stage}
      onLayout={(event) => {
        const next = event.nativeEvent.layout.height;
        if (next > 0) setViewHeight(next);
      }}
    >
      <FilamentScene>
        <OrbitScene
          character={character}
          viewHeight={viewHeight}
          readyIds={readyIds}
          onReady={onReady}
        />
      </FilamentScene>

      {showLoader ? (
        <View style={styles.loaderOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.onAccent} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  filament: {
    flex: 1,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stage: {
    backgroundColor: 'transparent',
    flex: 1,
    overflow: 'hidden',
  },
});
