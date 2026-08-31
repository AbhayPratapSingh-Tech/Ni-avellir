import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../common/middleware/require-auth.js';
import { WishlistService } from './wishlist.service.js';

export class WishlistController {
  constructor(private readonly service: WishlistService) {}

  get = async (request: AuthenticatedRequest, response: Response) => {
    const result = await this.service.get(request.userId!);
    response.json({ data: result });
  };

  toggle = async (request: AuthenticatedRequest, response: Response) => {
    const { productId } = request.body as { productId: string };
    const result = await this.service.toggle(request.userId!, productId);
    response.json({ data: result });
  };

  remove = async (request: AuthenticatedRequest, response: Response) => {
    const productId = request.params.productId as string;
    const result = await this.service.remove(request.userId!, productId);
    response.json({ data: result });
  };
}
