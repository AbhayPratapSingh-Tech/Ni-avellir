import { Router } from 'express';
import type { Env } from '../../config/env.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { createRequireAuth, optionalAuth } from '../../common/middleware/require-auth.js';
import { OrderController } from './order.controller.js';
import { OrderService } from './order.service.js';

export function createOrderRouter(env: Env) {
  const router = Router();
  const service = new OrderService();
  const controller = new OrderController(service);
  const authOptional = optionalAuth(env);
  const requireAuth = createRequireAuth(env);

  router.use(authOptional);

  router.post('/', asyncHandler(controller.create));
  router.get('/', asyncHandler(controller.list));
  router.get('/:id', asyncHandler(controller.getById));
  router.post('/:id/cancel', requireAuth, asyncHandler(controller.cancel));
  router.post('/:id/return', requireAuth, asyncHandler(controller.requestReturn));
  router.post('/:id/exchange', requireAuth, asyncHandler(controller.requestExchange));

  return router;
}
