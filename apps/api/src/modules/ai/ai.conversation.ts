import { nanoid } from 'nanoid';
import type { AIProductCard } from '@nidavellir/shared';

export type ConversationMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ConversationState = {
  id: string;
  userId?: string;
  messages: ConversationMessage[];
  lastProducts: AIProductCard[];
  updatedAt: number;
};

const STORE = new Map<string, ConversationState>();
const TTL_MS = 1000 * 60 * 60 * 6;

function prune() {
  const now = Date.now();
  for (const [id, state] of STORE) {
    if (now - state.updatedAt > TTL_MS) STORE.delete(id);
  }
}

export function getOrCreateConversation(conversationId: string | undefined, userId?: string) {
  prune();
  const id = conversationId?.trim() || nanoid(12);
  const existing = STORE.get(id);
  if (existing) {
    existing.updatedAt = Date.now();
    if (userId) existing.userId = userId;
    return existing;
  }
  const created: ConversationState = {
    id,
    userId,
    messages: [],
    lastProducts: [],
    updatedAt: Date.now(),
  };
  STORE.set(id, created);
  return created;
}

export function appendMessage(state: ConversationState, role: ConversationMessage['role'], content: string) {
  state.messages.push({ role, content });
  if (state.messages.length > 40) {
    state.messages = state.messages.slice(-40);
  }
  state.updatedAt = Date.now();
}
