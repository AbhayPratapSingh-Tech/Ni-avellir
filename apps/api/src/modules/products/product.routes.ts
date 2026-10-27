import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import type { Env } from '../../config/env.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { optionalAuth } from '../../common/middleware/require-auth.js';
import { ProductController } from './product.controller.js';
import { ProductService } from './product.service.js';

const visualUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1_500_000 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image uploads are allowed'));
      return;
    }
    cb(null, true);
  },
});

export function createProductRouter(env?: Env) {
  const router = Router();
  const service = new ProductService();
  const controller = new ProductController(service, env);

  const visualLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message: 'Too many visual searches. Try again in a minute.' } },
  });

  router.get('/', asyncHandler(controller.list));
  router.get('/bundles', asyncHandler(controller.listBundles));
  router.get('/featured', asyncHandler(controller.getFeatured));
  router.get('/limited-drops', asyncHandler(controller.getLimitedDrops));
  router.get('/deals', asyncHandler(controller.getDeals));
  router.get('/best-sellers', asyncHandler(controller.getBestSellers));
  router.get('/categories', asyncHandler(controller.getCategories));
  router.get('/franchises', asyncHandler(controller.getFranchises));
  router.get('/suggestions', asyncHandler(controller.getSuggestions));
  // Before /:slug so these paths are not captured as slugs.
  if (env) {
    router.get('/for-you', optionalAuth(env), asyncHandler(controller.getForYou));
    router.post(
      '/visual-search',
      visualLimiter,
      visualUpload.single('image'),
      asyncHandler(controller.visualSearch),
    );
  }
  router.get('/:slug/related', asyncHandler(controller.getRelated));
  router.get('/:slug', asyncHandler(controller.getBySlug));

  return router;
}
