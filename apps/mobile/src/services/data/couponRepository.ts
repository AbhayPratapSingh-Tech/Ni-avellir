import type { CouponOffer } from '@nidavellir/shared';
import { appConfig } from '../../config/appConfig';
import { apiClient } from '../api/apiClient';

const mockOffers: CouponOffer[] = [
  {
    id: 'mock-forge10',
    code: 'FORGE10',
    description: 'FORGE10: Get 10% off on cart value ₹999 and above.',
    discountType: 'percent',
    discountValue: 10,
    minOrderValue: 999,
    maxDiscount: 500,
  },
  {
    id: 'mock-welcome100',
    code: 'WELCOME100',
    description: 'WELCOME100: Get ₹100 off on cart value ₹499 and above.',
    discountType: 'flat',
    discountValue: 100,
    minOrderValue: 499,
  },
  {
    id: 'mock-summer10',
    code: 'SUMMER10',
    description: 'SUMMER10: Get 10% off on Cart value 6,000 and above.',
    discountType: 'percent',
    discountValue: 10,
    minOrderValue: 6000,
    maxDiscount: 1000,
  },
  {
    id: 'mock-justforyou',
    code: 'JUSTFORYOU',
    description: 'JUSTFORYOU: Get ₹250 off on Cart value 2,000 and above.',
    discountType: 'flat',
    discountValue: 250,
    minOrderValue: 2000,
  },
];

export const couponRepository = {
  async listAvailable(): Promise<CouponOffer[]> {
    if (appConfig.dataSource !== 'api') {
      return mockOffers;
    }
    try {
      const { data } = await apiClient.get('/coupons');
      return (data.data?.coupons ?? []) as CouponOffer[];
    } catch {
      return mockOffers.filter((c) => c.code === 'FORGE10' || c.code === 'WELCOME100');
    }
  },
};
