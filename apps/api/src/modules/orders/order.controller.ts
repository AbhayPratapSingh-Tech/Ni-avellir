import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../common/middleware/require-auth.js';
import type { GuestSessionRequest } from '../../common/middleware/guest-session.js';
import { OrderService, type CreateOrderInput } from './order.service.js';

type OrderRequest = AuthenticatedRequest & GuestSessionRequest;

export class OrderController {
  constructor(private readonly service: OrderService) {}

  create = async (request: OrderRequest, response: Response) => {
    const input = request.body as CreateOrderInput;
    const order = await this.service.create(input, request.userId);
    response.status(201).json({ data: { order } });
  };

  list = async (request: OrderRequest, response: Response) => {
    const email = request.query.email as string | undefined;
    const orders = await this.service.list(request.userId, email);
    response.json({ data: { orders } });
  };

  getById = async (request: OrderRequest, response: Response) => {
    const id = request.params.id as string;
    const order = await this.service.getById(id, request.userId);
    response.json({ data: { order } });
  };

  cancel = async (request: OrderRequest, response: Response) => {
    const id = request.params.id as string;
    const { reason } = request.body as { reason?: string };
    const order = await this.service.cancel(id, request.userId, reason);
    response.json({ data: { order } });
  };

  requestReturn = async (request: OrderRequest, response: Response) => {
    const id = request.params.id as string;
    const { reason } = request.body as { reason: string };
    const order = await this.service.requestReturn(id, request.userId, reason);
    response.json({ data: { order } });
  };

  requestExchange = async (request: OrderRequest, response: Response) => {
    const id = request.params.id as string;
    const { reason } = request.body as { reason: string };
    const order = await this.service.requestExchange(id, request.userId, reason);
    response.json({ data: { order } });
  };
}
