import { Router } from 'express';
import type { Env } from '../../config/env.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { createRequireAuth } from '../../common/middleware/require-auth.js';
import { WishlistController } from './wishlist.controller.js';
import { WishlistService } from './wishlist.service.js';

export function createWishlistRouter(env: Env) {
  const router = Router();
  const requireAuth = createRequireAuth(env);
  const controller = new WishlistController(new WishlistService());

  router.use(requireAuth);
  router.get('/', asyncHandler(controller.get));
  router.post('/toggle', asyncHandler(controller.toggle));
  router.delete('/:productId', asyncHandler(controller.remove));

  return router;
}
