import type { Request, Response } from 'express';
import { OrderService, type CreateOrderInput } from './order.service.js';

export class OrderController {
  constructor(private readonly service: OrderService) {}

  create = async (request: Request, response: Response) => {
    const input = request.body as CreateOrderInput;
    const order = await this.service.create(input);
    response.status(201).json({ data: { order } });
  };

  list = async (request: Request, response: Response) => {
    const email = request.query.email as string | undefined;
    const orders = await this.service.list(email);
    response.json({ data: { orders } });
  };

  getById = async (request: Request, response: Response) => {
    const id = request.params.id as string;
    const order = await this.service.getById(id);
    response.json({ data: { order } });
  };
}
