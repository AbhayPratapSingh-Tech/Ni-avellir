import { Router } from 'express';
import type { Env } from '../../config/env.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { checkoutIpLimit } from '../../common/middleware/ip-rate-limit.js';
import { createPaymentStack } from './payment.factory.js';

export function createPaymentRouter(env: Env) {
  const router = Router();
  const { controller } = createPaymentStack(env);

  router.post('/intents', checkoutIpLimit, asyncHandler(controller.createIntent));
  router.post('/razorpay/confirm', asyncHandler(controller.confirm));
  router.post('/razorpay/demo-complete', asyncHandler(controller.demoComplete));

  return router;
}
