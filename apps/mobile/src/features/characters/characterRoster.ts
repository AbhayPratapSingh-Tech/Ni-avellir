/**
 * Character Vault roster — display names + franchise for Visit Vault PLP.
 * Local GLBs via Metro `require` (see metro.config.js assetExts: glb).
 */

export type VaultCharacter = {
  id: string;
  displayName: string;
  brandLabel: string;
  /** Exact catalog franchise string for Products PLP. */
  franchise: string;
  /** Metro asset module id from require('*.glb'). */
  modelSource: number;
  posterUri: string;
  /** Idle clip index when enableIdleAnimation is true (clip 0 by convention). */
  idleAnimationIndex: number;
  /**
   * Only true when the GLB has at least one animation.
   * Mounting Animator on 0-clip models crashes Filament ("Expected <0, received 0").
   */
  enableIdleAnimation: boolean;
  /** Applied after transformToUnitCube so oversized game meshes fit the vault. */
  displayScale: [number, number, number];
  /**
   * Optional extra offset after unit-cube + scale.
   * Use when an idle pose’s visual mass is not at the GLB origin
   * (`transformToUnitCube` only centers the rest-pose AABB).
   */
  translate?: [number, number, number];
};

export const CHARACTER_VAULT_ROSTER: VaultCharacter[] = [
  {
    id: 'goku',
    displayName: 'Goku',
    brandLabel: 'Dragon Ball',
    franchise: 'Dragon Ball',
    modelSource: require('../../../assets/characters/goku.glb'),
    posterUri:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=80',
    idleAnimationIndex: 0,
    enableIdleAnimation: false,
    // Fit T-pose arms/legs inside the stage (too large clips limbs).
    displayScale: [1.12, 1.12, 1.12],
  },
  {
    id: 'vegeta',
    displayName: 'Vegeta',
    brandLabel: 'Dragon Ball',
    franchise: 'Dragon Ball',
    modelSource: require('../../../assets/characters/vegeta.glb'),
    posterUri:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80',
    idleAnimationIndex: 0,
    enableIdleAnimation: false,
    displayScale: [1.12, 1.12, 1.12],
  },
  {
    id: 'kid-levi',
    displayName: 'Kid Levi',
    brandLabel: 'Attack on Titan',
    franchise: 'Attack on Titan',
    modelSource: require('../../../assets/characters/kid_levi_ackerman.glb'),
    posterUri:
      'https://images.unsplash.com/photo-1613376023733-0f963823bc78?auto=format&fit=crop&w=900&q=80',
    // GLB clip 8 = lwer_anim_idle (clip 0 is a skill, not idle).
    idleAnimationIndex: 8,
    enableIdleAnimation: true,
    displayScale: [1.12, 1.12, 1.12],
    // Kid Levi only: idle pose is asymmetric (swords / cape / stance), so after
    // transformToUnitCube the visual center sits slightly to the viewer’s right.
    // Nudge X negative to optically center him. Prefer fixing the GLB origin in
    // Blender if this mesh is re-exported; do not copy this offset to other champs.
    translate: [-0.12, 0, 0],
  },
];

export function getVaultCharacter(id?: string): VaultCharacter {
  if (!id) return CHARACTER_VAULT_ROSTER[0]!;
  return CHARACTER_VAULT_ROSTER.find((item) => item.id === id) ?? CHARACTER_VAULT_ROSTER[0]!;
}

export function vaultCharacterIndex(id: string): number {
  const index = CHARACTER_VAULT_ROSTER.findIndex((item) => item.id === id);
  return index >= 0 ? index : 0;
}
