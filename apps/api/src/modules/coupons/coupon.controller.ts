import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../common/middleware/require-auth.js';
import { CouponService } from './coupon.service.js';

export class CouponController {
  constructor(private readonly service: CouponService) {}

  list = async (request: AuthenticatedRequest, response: Response) => {
    const coupons = await this.service.list(request.userId);
    response.json({
      data: {
        coupons: coupons.map((c) => ({
          id: String(c._id),
          code: c.code,
          description: c.description ?? '',
          discountType: c.discountType,
          discountValue: c.discountValue,
          minOrderValue: c.minOrderValue,
          maxDiscount: c.maxDiscount,
        })),
      },
    });
  };

  validate = async (request: AuthenticatedRequest, response: Response) => {
    const { code, subtotal } = request.body as { code: string; subtotal: number };
    const result = await this.service.validate(code, subtotal, request.userId);
    response.json({ data: result });
  };
}
