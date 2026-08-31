import { Router } from 'express';
import type { Env } from '../../config/env.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { optionalAuth } from '../../common/middleware/require-auth.js';
import { CouponController } from './coupon.controller.js';
import { CouponService } from './coupon.service.js';

export function createCouponRouter(env: Env) {
  const router = Router();
  const authOptional = optionalAuth(env);
  const controller = new CouponController(new CouponService());

  router.use(authOptional);
  router.get('/', asyncHandler(controller.list));
  router.post('/validate', asyncHandler(controller.validate));

  return router;
}
