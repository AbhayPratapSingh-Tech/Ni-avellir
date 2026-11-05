import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../common/middleware/require-auth.js';
import { AppError } from '../../common/errors/app-error.js';
import { LoyaltyService } from './loyalty.service.js';

export class LoyaltyController {
  constructor(private readonly service: LoyaltyService) {}

  catalogue = async (request: AuthenticatedRequest, response: Response) => {
    const data = await this.service.catalogue(request.userId!);
    response.json({ data });
  };

  redeem = async (request: AuthenticatedRequest, response: Response) => {
    const { rewardId, idempotencyKey: bodyKey } = request.body as {
      rewardId?: string;
      idempotencyKey?: string;
    };
    const headerKey = request.headers['idempotency-key'];
    const idempotencyKey =
      (typeof headerKey === 'string' ? headerKey : Array.isArray(headerKey) ? headerKey[0] : undefined) ??
      bodyKey;
    if (!rewardId || !idempotencyKey) {
      throw new AppError('Reward and idempotency key are required', 400);
    }
    const data = await this.service.redeem(request.userId!, rewardId, idempotencyKey);
    response.json({ data });
  };
}
