import type { Env } from '../../config/env.js';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';
import { CashOnDeliveryProvider } from './providers/cod.provider.js';
import { RazorpayProvider } from './providers/razorpay.provider.js';

export function createPaymentStack(env: Env) {
  const razorpay = new RazorpayProvider(
    env.razorpayKeyId,
    env.razorpayKeySecret,
    env.razorpayWebhookSecret,
  );
  const cod = new CashOnDeliveryProvider();
  const service = new PaymentService([razorpay, cod], razorpay);
  const controller = new PaymentController(service);
  return { razorpay, service, controller };
}
