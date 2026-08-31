import { AppError } from '../../common/errors/app-error.js';
import { Coupon } from './coupon.model.js';

export class CouponService {
  async list() {
    return Coupon.find({ active: true }).sort({ code: 1 }).lean();
  }

  async validate(code: string, subtotal: number, userId?: string) {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
    if (!coupon) throw new AppError('Invalid coupon', 404);
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new AppError('Coupon expired', 422);
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      throw new AppError('Coupon usage limit reached', 422);
    }
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      throw new AppError(`Minimum order value is ₹${coupon.minOrderValue}`, 422);
    }
    if (coupon.userIds.length && userId && !coupon.userIds.includes(userId)) {
      throw new AppError('Coupon not valid for this user', 403);
    }
    let discount = 0;
    if (coupon.discountType === 'percent') {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.discountValue;
    }
    return { coupon, discount };
  }
}
