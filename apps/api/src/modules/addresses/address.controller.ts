import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../common/middleware/require-auth.js';
import { AddressService } from './address.service.js';

export class AddressController {
  constructor(private readonly service: AddressService) {}

  list = async (request: AuthenticatedRequest, response: Response) => {
    const addresses = await this.service.list(request.userId!);
    response.json({ data: { addresses } });
  };

  create = async (request: AuthenticatedRequest, response: Response) => {
    const address = await this.service.create(request.userId!, request.body);
    response.status(201).json({ data: { address } });
  };

  update = async (request: AuthenticatedRequest, response: Response) => {
    const address = await this.service.update(
      request.userId!,
      request.params.id as string,
      request.body,
    );
    response.json({ data: { address } });
  };

  remove = async (request: AuthenticatedRequest, response: Response) => {
    const result = await this.service.remove(request.userId!, request.params.id as string);
    response.json({ data: result });
  };

  setDefault = async (request: AuthenticatedRequest, response: Response) => {
    const address = await this.service.setDefault(request.userId!, request.params.id as string);
    response.json({ data: { address } });
  };
}
