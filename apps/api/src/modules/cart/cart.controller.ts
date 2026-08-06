import type { Request, Response } from 'express';
import { CartService } from './cart.service.js';

export class CartController {
  constructor(private readonly service: CartService) {}

  quote = async (request: Request, response: Response) => {
    const { items } = request.body as { items?: Array<{ productId: string; quantity: number }> };
    const quote = await this.service.quote(items ?? []);
    response.json({ data: { quote } });
  };
}
