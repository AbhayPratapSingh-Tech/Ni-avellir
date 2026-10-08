import { Image } from 'react-native';
import { CHARACTER_VAULT_ROSTER } from './characterRoster';

const warmed = new Set<string>();

function warmUri(uri: string, id: string): void {
  if (warmed.has(id)) return;
  warmed.add(id);
  fetch(uri)
    .then((response) => response.arrayBuffer())
    .catch(() => {
      warmed.delete(id);
    });
}

/**
 * Warm Metro/HTTP bytes for vault GLBs.
 * Prefer `priorityId` first (default opener), then the rest.
 */
export function preloadVaultModels(priorityId?: string): void {
  const ordered = [...CHARACTER_VAULT_ROSTER].sort((a, b) => {
    if (a.id === priorityId) return -1;
    if (b.id === priorityId) return 1;
    return 0;
  });

  for (const character of ordered) {
    try {
      const asset = Image.resolveAssetSource(character.modelSource);
      const uri = asset?.uri;
      if (!uri) continue;
      warmUri(uri, character.id);
    } catch {
      // ignore resolve failures
    }
  }
}
