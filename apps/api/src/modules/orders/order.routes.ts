import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { OrderService } from './order.service.js';

export function createOrderRouter() {
  const router = Router();
  const service = new OrderService();
  const controller = new OrderController(service);

  router.post('/', controller.create);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);

  return router;
}
