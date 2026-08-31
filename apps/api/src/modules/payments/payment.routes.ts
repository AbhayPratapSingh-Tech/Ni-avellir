import { Router } from 'express';
import type { Env } from '../../config/env.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';
import { CashOnDeliveryProvider } from './providers/cod.provider.js';
import { RazorpayProvider } from './providers/razorpay.provider.js';

export function createPaymentRouter(env: Env) {
  const router = Router();
  const razorpay = new RazorpayProvider(env.razorpayKeyId, env.razorpayKeySecret);
  const cod = new CashOnDeliveryProvider();
  const service = new PaymentService([razorpay, cod], razorpay);
  const controller = new PaymentController(service);

  router.post('/intents', asyncHandler(controller.createIntent));
  router.post('/razorpay/confirm', asyncHandler(controller.confirm));
  router.post('/razorpay/demo-complete', asyncHandler(controller.demoComplete));

  return router;
}
