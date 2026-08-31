import { Router } from 'express';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { ProductController } from './product.controller.js';
import { ProductService } from './product.service.js';

export function createProductRouter() {
  const router = Router();
  const service = new ProductService();
  const controller = new ProductController(service);

  router.get('/', asyncHandler(controller.list));
  router.get('/featured', asyncHandler(controller.getFeatured));
  router.get('/limited-drops', asyncHandler(controller.getLimitedDrops));
  router.get('/deals', asyncHandler(controller.getDeals));
  router.get('/best-sellers', asyncHandler(controller.getBestSellers));
  router.get('/categories', asyncHandler(controller.getCategories));
  router.get('/franchises', asyncHandler(controller.getFranchises));
  router.get('/suggestions', asyncHandler(controller.getSuggestions));
  router.get('/:slug/related', asyncHandler(controller.getRelated));
  router.get('/:slug', asyncHandler(controller.getBySlug));

  return router;
}
