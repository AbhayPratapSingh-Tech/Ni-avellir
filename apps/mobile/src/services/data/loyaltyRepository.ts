import { appConfig } from '../../config/appConfig';
import { apiClient } from '../api/apiClient';

export type RuneReward = {
  id: string;
  title: string;
  description: string;
  xpCost: number;
  affordable: boolean;
};

export type RuneCoupon = {
  code: string;
  discountValue: number;
  minOrderValue: number;
  expiresAt: string | null;
};

export type LoyaltyCatalogue = {
  runeXp: number;
  freeShippingCredits: number;
  dropZoneEarlyUntil: string | null;
  coupons: RuneCoupon[];
  rewards: RuneReward[];
  replayed?: boolean;
};

export const loyaltyRepository = {
  async catalogue(): Promise<LoyaltyCatalogue | null> {
    if (appConfig.dataSource !== 'api') return null;
    const { data } = await apiClient.get('/loyalty');
    return data.data as LoyaltyCatalogue;
  },

  async redeem(rewardId: string, idempotencyKey: string): Promise<LoyaltyCatalogue> {
    const { data } = await apiClient.post(
      '/loyalty/redeem',
      { rewardId },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
    return data.data as LoyaltyCatalogue;
  },
};
