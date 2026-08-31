import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../common/middleware/require-auth.js';
import { NotificationService } from './notification.service.js';

export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  list = async (request: AuthenticatedRequest, response: Response) => {
    const notifications = await this.service.list(request.userId!);
    response.json({ data: { notifications } });
  };

  markRead = async (request: AuthenticatedRequest, response: Response) => {
    const result = await this.service.markRead(request.userId!, request.params.id as string);
    response.json({ data: result });
  };

  markAllRead = async (request: AuthenticatedRequest, response: Response) => {
    const result = await this.service.markAllRead(request.userId!);
    response.json({ data: result });
  };
}
