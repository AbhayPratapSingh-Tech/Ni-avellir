import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { Env } from './config/env.js';
import { errorHandler } from './common/middleware/error-handler.js';
import { notFoundHandler } from './common/middleware/not-found.js';
import { logger } from './common/logger/logger.js';
import { healthRouter } from './modules/health/health.routes.js';
import { createProductRouter } from './modules/products/product.routes.js';
import { createCartRouter } from './modules/cart/cart.routes.js';
import { createOrderRouter } from './modules/orders/order.routes.js';
import { createPaymentRouter } from './modules/payments/payment.routes.js';

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
  app.use(express.json({ limit: '1mb' }));
  app.use(mongoSanitize());

  app.use('/health', healthRouter);
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/products', createProductRouter());
  app.use('/api/v1/cart', createCartRouter());
  app.use('/api/v1/orders', createOrderRouter());
  app.use('/api/v1/payments', createPaymentRouter(env));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
