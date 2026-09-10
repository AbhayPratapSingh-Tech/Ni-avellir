/**
 * Lightweight display hints for known bundle tags (banner art until CMS).
 * Membership / main SKU always come from the products API (`bundleTag`, `isBundleMain`).
 */
export type BundleDisplayHint = {
  tag: string;
  name: string;
  subtitle: string;
  bannerImage: string;
};

export const BUNDLE_DISPLAY_HINTS: BundleDisplayHint[] = [
  {
    tag: 'DEMON_PR',
    name: 'Demon Slayer Bundle',
    subtitle: 'Haori nights · corps lineup',
    bannerImage:
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1400&q=80',
  },
  {
    tag: 'NARUTO_PR',
    name: 'Naruto Bundle',
    subtitle: 'Hidden Leaf street kit',
    bannerImage:
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1400&q=80',
  },
  {
    tag: 'AOT_PR',
    name: 'Attack on Titan Bundle',
    subtitle: 'Survey Corps parade set',
    bannerImage:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80',
  },
  {
    tag: 'JJK_PR',
    name: 'Jujutsu Kaisen Bundle',
    subtitle: 'Tokyo Jujutsu High haul',
    bannerImage:
      'https://images.unsplash.com/photo-1612287230202-1ff1d867d530?auto=format&fit=crop&w=1400&q=80',
  },
  {
    tag: 'ONEPIECE_PR',
    name: 'One Piece Bundle',
    subtitle: 'Straw Hat grand line set',
    bannerImage:
      'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=1400&q=80',
  },
];

export function getBundleDisplayHint(tag?: string | null): BundleDisplayHint | undefined {
  if (!tag) return undefined;
  return BUNDLE_DISPLAY_HINTS.find((b) => b.tag === tag);
}

/** Resolve bundle tag from a live product payload (API fields only). */
export function resolveProductBundleTag(product: {
  bundleTag?: string | null;
  tags?: string[];
}): string | undefined {
  if (product.bundleTag?.trim()) return product.bundleTag.trim();
  const known = new Set(BUNDLE_DISPLAY_HINTS.map((b) => b.tag));
  return product.tags?.find((t) => known.has(t));
}
