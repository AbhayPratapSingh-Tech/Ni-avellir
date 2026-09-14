import { Router } from 'express';
import type { Env } from '../../config/env.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { optionalAuth } from '../../common/middleware/require-auth.js';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';

export function createAiRouter(env: Env) {
  const router = Router();
  const controller = new AiController(new AiService(env));

  router.post('/chat', optionalAuth(env), asyncHandler(controller.chat));

  return router;
}
