import { Router } from 'express';
import type { Env } from '../../config/env.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { createRequireAuth } from '../../common/middleware/require-auth.js';
import { AddressController } from './address.controller.js';
import { AddressService } from './address.service.js';

export function createAddressRouter(env: Env) {
  const router = Router();
  const requireAuth = createRequireAuth(env);
  const controller = new AddressController(new AddressService());

  router.use(requireAuth);
  router.get('/', asyncHandler(controller.list));
  router.post('/', asyncHandler(controller.create));
  router.patch('/:id', asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.remove));
  router.patch('/:id/default', asyncHandler(controller.setDefault));

  return router;
}
