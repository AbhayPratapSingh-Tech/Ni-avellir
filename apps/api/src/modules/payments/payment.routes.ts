import { Router } from 'express';
import type { Env } from '../../config/env.js';
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

  router.post('/intents', controller.createIntent);
  router.post('/razorpay/confirm', controller.confirm);
  router.post('/razorpay/demo-complete', controller.demoComplete);

  return router;
}
