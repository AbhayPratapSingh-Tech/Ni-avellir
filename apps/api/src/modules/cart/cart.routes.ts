import { Router } from 'express';
import type { Env } from '../../config/env.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { createRequireAuth, optionalAuth } from '../../common/middleware/require-auth.js';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';

export function createCartRouter(_env: Env) {
  const router = Router();
  const service = new CartService();
  const controller = new CartController(service);
  const requireAuth = createRequireAuth(_env);
  const authOptional = optionalAuth(_env);

  router.use(authOptional);

  router.post('/quote', asyncHandler(controller.quote));
  router.get('/', asyncHandler(controller.getCart));
  router.post('/items', asyncHandler(controller.addItem));
  router.patch('/items/:productId', asyncHandler(controller.updateItem));
  router.delete('/items/:productId', asyncHandler(controller.removeItem));
  router.delete('/', asyncHandler(controller.clearCart));
  router.post('/apply-coupon', asyncHandler(controller.applyCoupon));
  router.post('/remove-coupon', asyncHandler(controller.removeCoupon));
  router.post('/merge', requireAuth, asyncHandler(controller.merge));

  return router;
}
