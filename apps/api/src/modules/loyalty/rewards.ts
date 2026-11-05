export const RUNE_REWARDS = [
  {
    id: 'flat_50',
    title: '₹50 off',
    description: 'One coupon, ₹50 off an order of ₹499 or more. Expires in 90 days.',
    xpCost: 100,
  },
  {
    id: 'free_shipping',
    title: 'Free shipping',
    description: 'One order ships free when delivery would otherwise be charged.',
    xpCost: 250,
  },
  {
    id: 'drop_zone_early',
    title: 'Early Drop Zone',
    description: 'For 7 days, Drop Zone shows today’s picks plus the rest of the eligible pool. Redeeming again adds another 7 days.',
    xpCost: 1000,
  },
] as const;

export type RuneRewardId = (typeof RUNE_REWARDS)[number]['id'];

export const EARLY_DROP_MS = 7 * 24 * 60 * 60 * 1000;
export const FLAT_50_MIN_ORDER = 499;
export const FLAT_50_VALUE = 50;
export const FLAT_50_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export function runeReward(id: string) {
  return RUNE_REWARDS.find((reward) => reward.id === id) ?? null;
}
