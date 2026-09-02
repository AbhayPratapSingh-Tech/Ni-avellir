import { Router } from 'express';
import type { Env } from '../../config/env.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { createPaymentStack } from './payment.factory.js';

/** Mounted before express.json() so webhook signature verification uses the raw body. */
export function createPaymentWebhookRouter(env: Env) {
  const router = Router();
  const { controller } = createPaymentStack(env);
  router.post('/', asyncHandler(controller.razorpayWebhook));
  return router;
}
