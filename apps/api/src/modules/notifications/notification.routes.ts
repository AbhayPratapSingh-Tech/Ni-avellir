import { Router } from 'express';
import type { Env } from '../../config/env.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { createRequireAuth } from '../../common/middleware/require-auth.js';
import { NotificationController } from './notification.controller.js';
import { NotificationService } from './notification.service.js';

export function createNotificationRouter(env: Env) {
  const router = Router();
  const requireAuth = createRequireAuth(env);
  const controller = new NotificationController(new NotificationService());

  router.use(requireAuth);
  router.get('/', asyncHandler(controller.list));
  router.patch('/:id/read', asyncHandler(controller.markRead));
  router.post('/read-all', asyncHandler(controller.markAllRead));

  return router;
}
