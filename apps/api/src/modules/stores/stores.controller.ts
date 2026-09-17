import type { Request, Response } from 'express';
import { storesService } from './stores.service.js';

export class StoresController {
  list = async (request: Request, response: Response) => {
    const q = typeof request.query.q === 'string' ? request.query.q : undefined;
    const city = typeof request.query.city === 'string' ? request.query.city : undefined;
    const state = typeof request.query.state === 'string' ? request.query.state : undefined;
    const stores = await storesService.list({ q, city, state });
    response.json({ data: { stores } });
  };

  geocode = async (request: Request, response: Response) => {
    const q = typeof request.query.q === 'string' ? request.query.q : '';
    const result = await storesService.geocode(q);
    response.json({ data: result });
  };
}
