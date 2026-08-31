import type { Request, Response } from 'express';
import { serviceabilityService } from './serviceability.service.js';

export class ServiceabilityController {
  check = async (request: Request, response: Response) => {
    const pincode = (request.query.pincode as string | undefined) ?? '';
    const result = await serviceabilityService.resolve(pincode);
    response.json({ data: result });
  };
}
