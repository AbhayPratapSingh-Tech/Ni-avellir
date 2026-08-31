import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../common/middleware/require-auth.js';
import { createRequireAuth } from '../../common/middleware/require-auth.js';
import type { Env } from '../../config/env.js';
import { ReviewService } from './review.service.js';

export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  list = async (request: Request, response: Response) => {
    const productId = request.query.productId as string;
    const reviews = await this.service.listByProduct(productId);
    response.json({ data: { reviews } });
  };

  create = async (request: AuthenticatedRequest, response: Response) => {
    const review = await this.service.create(request.userId!, request.body);
    response.status(201).json({ data: { review } });
  };
}

export function createReviewRouterHandlers(env: Env) {
  const requireAuth = createRequireAuth(env);
  const controller = new ReviewController(new ReviewService());
  return { controller, requireAuth };
}
