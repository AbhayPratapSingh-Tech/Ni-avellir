import { Router } from 'express';
import { ProductController } from './product.controller.js';
import { ProductService } from './product.service.js';

export function createProductRouter() {
  const router = Router();
  const service = new ProductService();
  const controller = new ProductController(service);

  router.get('/', controller.list);
  router.get('/featured', controller.getFeatured);
  router.get('/limited-drops', controller.getLimitedDrops);
  router.get('/categories', controller.getCategories);
  router.get('/franchises', controller.getFranchises);
  router.get('/:slug', controller.getBySlug);

  return router;
}
