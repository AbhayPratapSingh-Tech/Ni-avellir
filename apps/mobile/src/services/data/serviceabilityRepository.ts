import type { ServiceabilityDto } from '@nidavellir/shared';
import { appConfig } from '../../config/appConfig';
import { apiClient } from '../api/apiClient';

const mockByPrefix: Record<string, Omit<ServiceabilityDto, 'pincode'>> = {
  '110': {
    serviceable: true,
    codAvailable: true,
    shippingCharge: 79,
    freeShippingThreshold: 999,
    etaDays: 3,
  },
  '500': {
    serviceable: true,
    codAvailable: false,
    shippingCharge: 129,
    freeShippingThreshold: 1999,
    etaDays: 6,
  },
  '000': {
    serviceable: true,
    codAvailable: true,
    shippingCharge: 99,
    freeShippingThreshold: 1499,
    etaDays: 5,
  },
};

function mockResolve(pincode: string): ServiceabilityDto {
  const prefix = pincode.slice(0, 3);
  const rule = mockByPrefix[prefix] ?? mockByPrefix['000']!;
  return { pincode, ...rule };
}

export const serviceabilityRepository = {
  async check(pincode: string): Promise<ServiceabilityDto> {
    const pin = pincode.replace(/\D/g, '').slice(0, 6);
    if (pin.length < 6) {
      return {
        pincode: pin,
        serviceable: false,
        codAvailable: false,
        shippingCharge: 0,
        freeShippingThreshold: 0,
        etaDays: 0,
      };
    }
    if (appConfig.dataSource !== 'api') {
      return mockResolve(pin);
    }
    try {
      const { data } = await apiClient.get('/serviceability', { params: { pincode: pin } });
      return data.data as ServiceabilityDto;
    } catch {
      return mockResolve(pin);
    }
  },
};
