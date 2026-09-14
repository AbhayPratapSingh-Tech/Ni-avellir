import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../common/middleware/require-auth.js';
import type { GuestSessionRequest } from '../../common/middleware/guest-session.js';
import type { AiService } from './ai.service.js';

type AiRequest = AuthenticatedRequest & GuestSessionRequest;

export class AiController {
  constructor(private readonly service: AiService) {}

  chat = async (request: AiRequest, response: Response) => {
    const body = request.body as { conversationId?: string; message?: string };
    const result = await this.service.chat({
      conversationId: body.conversationId,
      message: body.message ?? '',
      userId: request.userId,
      guestSessionId: request.guestSessionId,
    });
    response.json({ data: result });
  };
}
