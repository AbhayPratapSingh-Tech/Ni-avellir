import { Router } from 'express';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';

export function createCartRouter() {
  const router = Router();
  const service = new CartService();
  const controller = new CartController(service);

  router.post('/quote', controller.quote);

  return router;
}
