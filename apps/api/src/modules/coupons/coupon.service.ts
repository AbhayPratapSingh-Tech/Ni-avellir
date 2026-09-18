import { AppError } from '../../common/errors/app-error.js';
import { User } from '../auth/user.model.js';
import { Coupon } from './coupon.model.js';

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '').slice(-10);
}

function isAssignedToCaller(
  userIds: string[],
  userId?: string,
  phone?: string,
): boolean {
  if (!userIds.length) return true;
  if (userId && userIds.includes(userId)) return true;
  const normalized = phone ? normalizePhone(phone) : '';
  if (normalized && userIds.includes(normalized)) return true;
  return false;
}

export class CouponService {
  async list(userId?: string) {
    let phone: string | undefined;
    if (userId) {
      const user = await User.findById(userId).select('phone').lean();
      phone = user?.phone ? normalizePhone(user.phone) : undefined;
    }

    const coupons = await Coupon.find({ active: true }).sort({ code: 1 }).lean();
    return coupons.filter((coupon) => isAssignedToCaller(coupon.userIds ?? [], userId, phone));
  }

  async assertUsable(code: string, userId?: string) {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
    if (!coupon) throw new AppError('Invalid coupon', 404);
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new AppError('Coupon expired', 422);
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      throw new AppError('Coupon usage limit reached', 422);
    }

    let phone: string | undefined;
    if (userId) {
      const user = await User.findById(userId).select('phone').lean();
      phone = user?.phone ? normalizePhone(user.phone) : undefined;
    }
    if (!isAssignedToCaller(coupon.userIds ?? [], userId, phone)) {
      throw new AppError('Coupon not valid for this user', 403);
    }
    return coupon;
  }

  async validate(code: string, subtotal: number, userId?: string) {
    const coupon = await this.assertUsable(code, userId);
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      throw new AppError(`Minimum order value is ₹${coupon.minOrderValue}`, 422);
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
