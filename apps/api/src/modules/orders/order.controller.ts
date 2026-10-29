import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../common/middleware/require-auth.js';
import type { GuestSessionRequest } from '../../common/middleware/guest-session.js';
import type { PaymentService } from '../payments/payment.service.js';
import { OrderService, type CreateOrderInput } from './order.service.js';

type OrderRequest = AuthenticatedRequest & GuestSessionRequest;

export class OrderController {
  constructor(
    private readonly service: OrderService,
    private readonly paymentService?: PaymentService,
  ) {}

  create = async (request: OrderRequest, response: Response) => {
    const input = request.body as CreateOrderInput;
    const headerKey = request.headers['idempotency-key'];
    const idempotencyKey =
      typeof headerKey === 'string'
        ? headerKey
        : Array.isArray(headerKey)
          ? headerKey[0]
          : undefined;
    const result = await this.service.create(input, request.userId, idempotencyKey);
    response.status(result.replayed ? 200 : 201).json({
      data: {
        order: result.order,
        awardedXp: result.awardedXp,
        replayed: result.replayed,
      },
    });
  };

  list = async (request: OrderRequest, response: Response) => {
    const orders = await this.service.list(request.userId!);
    response.json({ data: { orders } });
  };

  getById = async (request: OrderRequest, response: Response) => {
    const id = request.params.id as string;
    // Reconcile pending Razorpay orders when the user opens Order Details.
    if (this.paymentService) {
      try {
        await this.paymentService.reconcileOrderById(id);
      } catch {
        // Never block order detail on reconcile failure.
      }
    }
    const order = await this.service.getById(id, request.userId!);
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
