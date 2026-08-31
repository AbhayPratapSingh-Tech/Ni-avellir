import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../common/middleware/require-auth.js';
import type { GuestSessionRequest } from '../../common/middleware/guest-session.js';
import { CartService } from './cart.service.js';

type CartRequest = AuthenticatedRequest & GuestSessionRequest;

export class CartController {
  constructor(private readonly service: CartService) {}

  private ctx(request: CartRequest) {
    return {
      userId: request.userId,
      guestSessionId: request.guestSessionId,
      pincode: request.query.pincode as string | undefined,
    };
  }

  quote = async (request: CartRequest, response: Response) => {
    const { items } = request.body as { items?: Array<{ productId: string; quantity: number }> };
    const pincode = request.query.pincode as string | undefined;
    const quote = await this.service.quote(items ?? [], pincode);
    response.json({ data: { quote } });
  };

  getCart = async (request: CartRequest, response: Response) => {
    const { userId, guestSessionId, pincode } = this.ctx(request);
    const result = await this.service.getCart(userId, guestSessionId, pincode);
    response.json({ data: result });
  };

  addItem = async (request: CartRequest, response: Response) => {
    const { userId, guestSessionId, pincode } = this.ctx(request);
    const { productId, quantity } = request.body as { productId: string; quantity?: number };
    const result = await this.service.addItem(userId, guestSessionId, productId, quantity ?? 1, pincode);
    response.json({ data: result });
  };

  updateItem = async (request: CartRequest, response: Response) => {
    const { userId, guestSessionId, pincode } = this.ctx(request);
    const productId = request.params.productId as string;
    const { quantity } = request.body as { quantity: number };
    const result = await this.service.updateItem(userId, guestSessionId, productId, quantity, pincode);
    response.json({ data: result });
  };

  removeItem = async (request: CartRequest, response: Response) => {
    const { userId, guestSessionId, pincode } = this.ctx(request);
    const productId = request.params.productId as string;
    const result = await this.service.removeItem(userId, guestSessionId, productId, pincode);
    response.json({ data: result });
  };

  clearCart = async (request: CartRequest, response: Response) => {
    const { userId, guestSessionId } = this.ctx(request);
    const result = await this.service.clearCart(userId, guestSessionId);
    response.json({ data: result });
  };

  applyCoupon = async (request: CartRequest, response: Response) => {
    const { userId, guestSessionId, pincode } = this.ctx(request);
    const { code } = request.body as { code: string };
    const result = await this.service.applyCoupon(userId, guestSessionId, code, pincode);
    response.json({ data: result });
  };

  removeCoupon = async (request: CartRequest, response: Response) => {
    const { userId, guestSessionId, pincode } = this.ctx(request);
    const result = await this.service.removeCoupon(userId, guestSessionId, pincode);
    response.json({ data: result });
  };

  merge = async (request: AuthenticatedRequest, response: Response) => {
    const guestSessionId = request.headers['x-guest-session'] as string;
    const pincode = request.query.pincode as string | undefined;
    const result = await this.service.mergeGuestCart(request.userId!, guestSessionId, pincode);
    response.json({ data: result });
  };
}
