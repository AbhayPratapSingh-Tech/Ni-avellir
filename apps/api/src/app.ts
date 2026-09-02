import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { Env } from './config/env.js';
import { errorHandler } from './common/middleware/error-handler.js';
import { guestSessionMiddleware } from './common/middleware/guest-session.js';
import { notFoundHandler } from './common/middleware/not-found.js';
import { logger } from './common/logger/logger.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { createProductRouter } from './modules/products/product.routes.js';
import { createCartRouter } from './modules/cart/cart.routes.js';
import { createOrderRouter } from './modules/orders/order.routes.js';
import { createPaymentRouter } from './modules/payments/payment.routes.js';
import { createPaymentWebhookRouter } from './modules/payments/payment-webhook.routes.js';
import { createAddressRouter } from './modules/addresses/address.routes.js';
import { createWishlistRouter } from './modules/wishlist/wishlist.routes.js';
import { createCouponRouter } from './modules/coupons/coupon.routes.js';
import { createReviewRouter } from './modules/reviews/review.routes.js';
import { createNotificationRouter } from './modules/notifications/notification.routes.js';
import { createServiceabilityRouter } from './modules/serviceability/serviceability.routes.js';

export function createApp(env: Env) {
  const app = express();

  app.disable('x-powered-by');
  app.use(pinoHttp({ logger }));
  app.use(helmet());
  app.use(
    cors({
      credentials: true,
      origin: env.corsOrigins,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(
    '/api/v1/payments/razorpay/webhook',
    express.raw({ type: 'application/json' }),
    createPaymentWebhookRouter(env),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(mongoSanitize());
  app.use(guestSessionMiddleware);

  app.use('/health', healthRouter);
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', createAuthRouter(env));
  app.use('/api/v1/products', createProductRouter());
  app.use('/api/v1/cart', createCartRouter(env));
  app.use('/api/v1/orders', createOrderRouter(env));
  app.use('/api/v1/payments', createPaymentRouter(env));
  app.use('/api/v1/addresses', createAddressRouter(env));
  app.use('/api/v1/wishlist', createWishlistRouter(env));
  app.use('/api/v1/coupons', createCouponRouter(env));
  app.use('/api/v1/reviews', createReviewRouter(env));
  app.use('/api/v1/notifications', createNotificationRouter(env));
  app.use('/api/v1/serviceability', createServiceabilityRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
