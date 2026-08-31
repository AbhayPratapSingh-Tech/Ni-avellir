import { Router } from 'express';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { ServiceabilityController } from './serviceability.controller.js';

export function createServiceabilityRouter() {
  const router = Router();
  const controller = new ServiceabilityController();
  router.get('/', asyncHandler(controller.check));
  return router;
}
