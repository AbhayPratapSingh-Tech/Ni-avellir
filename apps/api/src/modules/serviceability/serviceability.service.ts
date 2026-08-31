import { ServiceabilityRule } from './serviceability.model.js';

const DEFAULTS = {
  codAvailable: true,
  shippingCharge: 99,
  freeShippingThreshold: 1499,
  etaDays: 5,
};

export class ServiceabilityService {
  async resolve(pincode?: string) {
    if (!pincode || pincode.length < 3) {
      return { ...DEFAULTS, pincode: pincode ?? '', serviceable: true };
    }
    const prefix = pincode.slice(0, 3);
    const rule =
      (await ServiceabilityRule.findOne({ pincodePrefix: prefix, active: true }).lean()) ??
      (await ServiceabilityRule.findOne({ pincodePrefix: '000', active: true }).lean());
    if (!rule) {
      return { ...DEFAULTS, pincode, serviceable: true };
    }
    return {
      pincode,
      serviceable: rule.active,
      codAvailable: rule.codAvailable,
      shippingCharge: rule.shippingCharge,
      freeShippingThreshold: rule.freeShippingThreshold,
      etaDays: rule.etaDays,
    };
  }
}

export const serviceabilityService = new ServiceabilityService();
