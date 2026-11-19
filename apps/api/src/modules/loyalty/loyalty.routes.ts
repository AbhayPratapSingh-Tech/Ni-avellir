import { Router } from 'express';
import type { Env } from '../../config/env.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { loyaltyIpLimit } from '../../common/middleware/ip-rate-limit.js';
import { createRequireAuth } from '../../common/middleware/require-auth.js';
import { LoyaltyController } from './loyalty.controller.js';
import { LoyaltyService } from './loyalty.service.js';

export function createLoyaltyRouter(env: Env) {
  const router = Router();
  const requireAuth = createRequireAuth(env);
  const controller = new LoyaltyController(new LoyaltyService());

  router.use(requireAuth);
  router.get('/', asyncHandler(controller.catalogue));
  router.post('/redeem', loyaltyIpLimit, asyncHandler(controller.redeem));

  return router;
}
