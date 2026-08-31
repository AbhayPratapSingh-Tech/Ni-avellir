import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../common/middleware/require-auth.js';
import { CouponService } from './coupon.service.js';

export class CouponController {
  constructor(private readonly service: CouponService) {}

  list = async (_request: AuthenticatedRequest, response: Response) => {
    const coupons = await this.service.list();
    response.json({ data: { coupons } });
  };

  validate = async (request: AuthenticatedRequest, response: Response) => {
    const { code, subtotal } = request.body as { code: string; subtotal: number };
    const result = await this.service.validate(code, subtotal, request.userId);
    response.json({ data: result });
  };
}
