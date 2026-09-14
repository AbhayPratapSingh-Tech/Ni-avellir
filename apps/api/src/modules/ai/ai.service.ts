import type { AIResponse } from '@nidavellir/shared';
import type { Env } from '../../config/env.js';
import { AppError } from '../../common/errors/app-error.js';
import { appendMessage, getOrCreateConversation } from './ai.conversation.js';
import { runLlmOrchestrator } from './ai.llm.js';
import { runStubOrchestrator } from './ai.stub.js';
import { AiTools } from './ai.tools.js';

export class AiService {
  private readonly tools = new AiTools();

  constructor(private readonly env: Env) {}

  async chat(input: {
    conversationId?: string;
    message: string;
    userId?: string;
    guestSessionId?: string;
  }): Promise<AIResponse> {
    if (!this.env.aiEnabled) {
      throw new AppError('Heimdall is temporarily unavailable.', 503);
    }

    const message = input.message?.trim();
    if (!message) {
      throw new AppError('Message is required', 400);
    }
    if (message.length > 2000) {
      throw new AppError('Message is too long', 400);
    }

    const conversation = getOrCreateConversation(input.conversationId, input.userId);
    const ctx = { userId: input.userId, guestSessionId: input.guestSessionId };

    let response: AIResponse;
    try {
      if (this.env.openaiApiKey) {
        response = await runLlmOrchestrator({
          env: this.env,
          message,
          conversation,
          ctx,
          tools: this.tools,
        });
      } else {
        response = await runStubOrchestrator({
          message,
          conversation,
          ctx,
          tools: this.tools,
        });
      }
    } catch {
      response = await runStubOrchestrator({
        message,
        conversation,
        ctx,
        tools: this.tools,
      });
    }

    appendMessage(conversation, 'user', message);
    appendMessage(conversation, 'assistant', response.message);
    return response;
  }
}
