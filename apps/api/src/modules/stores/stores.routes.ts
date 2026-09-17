import { Router } from 'express';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { StoresController } from './stores.controller.js';

export function createStoresRouter() {
  const router = Router();
  const controller = new StoresController();
  router.get('/geocode', asyncHandler(controller.geocode));
  router.get('/', asyncHandler(controller.list));
  return router;
}
