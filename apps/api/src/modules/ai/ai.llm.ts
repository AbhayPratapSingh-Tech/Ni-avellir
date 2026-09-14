import type { AIResponse } from '@nidavellir/shared';
import type { Env } from '../../config/env.js';
import type { ConversationState } from './ai.conversation.js';
import { AiTools, aiToolDefinitions, type AiToolContext } from './ai.tools.js';
import { toolResultToResponse } from './ai.stub.js';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
};

const SYSTEM_PROMPT = `You are Heimdall — the personal guide and Niðavellir partner for anime merch (collectibles, apparel, desk gear, limited drops).
Rules:
- Use tools for products, cart, wishlist, orders, and policies. Never invent prices, stock, or order status.
- If a tool returns no data, say so honestly.
- Keep replies short and helpful for mobile chat.
- Prefer INR and Indian shopping phrasing.
- Introduce yourself as Heimdall when asked who you are.`;

export async function runLlmOrchestrator(params: {
  env: Env;
  message: string;
  conversation: ConversationState;
  ctx: AiToolContext;
  tools: AiTools;
}): Promise<AIResponse> {
  const { env, message, conversation, ctx, tools } = params;
  const baseUrl = (env.openaiBaseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = env.openaiModel || 'gpt-4o-mini';

  const history: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversation.messages.slice(-12).map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  let lastStructured: AIResponse | null = null;

  for (let round = 0; round < 4; round += 1) {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: history,
        tools: aiToolDefinitions,
        tool_choice: 'auto',
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`LLM request failed (${response.status}): ${body.slice(0, 200)}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: ChatMessage }>;
    };
    const assistant = json.choices?.[0]?.message;
    if (!assistant) {
      return {
        type: 'error',
        conversationId: conversation.id,
        message: 'Sorry, I could not get a reply right now. Please try again.',
        code: 'llm_empty',
      };
    }

    history.push(assistant);

    const toolCalls = assistant.tool_calls ?? [];
    if (!toolCalls.length) {
      const text = (assistant.content || '').trim();
      if (lastStructured) {
        if (text) {
          return { ...lastStructured, message: text };
        }
        return lastStructured;
      }
      return {
        type: 'text',
        conversationId: conversation.id,
        message: text || 'How can Heimdall help with your merch hunt?',
      };
    }

    for (const call of toolCalls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || '{}') as Record<string, unknown>;
      } catch {
        args = {};
      }
      const result = await tools.run(call.function.name, args, ctx);
      if (result.kind === 'products') {
        conversation.lastProducts = result.products;
      }
      if (result.kind === 'product') {
        conversation.lastProducts = [result.product];
      }
      lastStructured = toolResultToResponse(conversation.id, result);
      history.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return (
    lastStructured ?? {
      type: 'text',
      conversationId: conversation.id,
      message: 'Sorry, I could not finish that request. Please try again.',
    }
  );
}
