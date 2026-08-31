import { Router } from 'express';
import type { Env } from '../../config/env.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { createRequireAuth } from '../../common/middleware/require-auth.js';
import { ReviewController } from './review.controller.js';
import { ReviewService } from './review.service.js';

export function createReviewRouter(env?: Env) {
  const router = Router();
  const controller = new ReviewController(new ReviewService());
  const requireAuth = env ? createRequireAuth(env) : undefined;

  router.get('/', asyncHandler(controller.list));
  if (requireAuth) {
    router.post('/', requireAuth, asyncHandler(controller.create));
  }

  return router;
}
