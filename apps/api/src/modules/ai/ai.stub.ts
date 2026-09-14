import type { AIResponse } from '@nidavellir/shared';
import type { ConversationState } from './ai.conversation.js';
import { AiTools, type AiToolContext, type ToolResult } from './ai.tools.js';

function parsePriceCap(text: string): number | undefined {
  const under = text.match(/(?:under|below|less than|<)\s*(?:₹|rs\.?\s*)?(\d+(?:\.\d+)?)\s*(k)?/i);
  if (under) {
    const n = Number(under[1]);
    return under[2] ? n * 1000 : n;
  }
  const plain = text.match(/(?:₹|rs\.?\s*)(\d+(?:\.\d+)?)\s*(k)?/i);
  if (plain && /under|below|max|budget/i.test(text)) {
    const n = Number(plain[1]);
    return plain[2] ? n * 1000 : n;
  }
  return undefined;
}

function detectCategory(text: string): string | undefined {
  if (/desk|gear|mouse|keyboard|pad/i.test(text)) return 'desk-gear';
  if (/apparel|tee|hoodie|shirt|wear/i.test(text)) return 'apparel';
  if (/limited|drop/i.test(text)) return 'limited-drops';
  if (/figure|collect|statue|figurine/i.test(text)) return 'collectibles';
  return undefined;
}

function extractSearchTerms(text: string): string | undefined {
  const cleaned = text
    .replace(/show me|find|i want|looking for|under \d+k?|below \d+|₹\d+/gi, ' ')
    .replace(/[^a-z0-9\s-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length >= 2 ? cleaned : undefined;
}

function toolResultToResponse(conversationId: string, result: ToolResult): AIResponse {
  switch (result.kind) {
    case 'products':
      return {
        type: 'product_results',
        conversationId,
        message: result.message,
        products: result.products,
      };
    case 'product':
      return {
        type: 'product_results',
        conversationId,
        message: result.message,
        products: [result.product],
      };
    case 'cart':
      return { type: 'cart', conversationId, message: result.message, cart: result.cart };
    case 'wishlist':
      return {
        type: 'wishlist',
        conversationId,
        message: result.message,
        wishlist: result.wishlist,
      };
    case 'order':
      return { type: 'order', conversationId, message: result.message, order: result.order };
    case 'orders':
      if (result.orders[0]) {
        return {
          type: 'order',
          conversationId,
          message: result.message,
          order: result.orders[0],
        };
      }
      return { type: 'text', conversationId, message: result.message };
    case 'knowledge':
      return { type: 'text', conversationId, message: result.message };
    case 'error':
      return {
        type: 'error',
        conversationId,
        message: result.message,
        code: result.code,
      };
    case 'text':
    default:
      return { type: 'text', conversationId, message: result.message };
  }
}

/** Rule-based orchestrator when no LLM key is configured. Uses real commerce tools only. */
export async function runStubOrchestrator(params: {
  message: string;
  conversation: ConversationState;
  ctx: AiToolContext;
  tools: AiTools;
}): Promise<AIResponse> {
  const { message, conversation, ctx, tools } = params;
  const text = message.trim();
  const lower = text.toLowerCase();

  if (/return policy|exchange|refund|shipping|delivery|cod|payment|faq|warranty|how long/i.test(lower)) {
    const result = await tools.run('searchKnowledgeBase', { query: text }, ctx);
    return toolResultToResponse(conversation.id, result);
  }

  if (/wishlist/i.test(lower)) {
    if (/add/.test(lower)) {
      const first = conversation.lastProducts[0];
      if (!first) {
        return {
          type: 'text',
          conversationId: conversation.id,
          message: 'Tell me which product to add, or search products first.',
        };
      }
      const result = await tools.run('addToWishlist', { productId: first.id }, ctx);
      return toolResultToResponse(conversation.id, result);
    }
    if (/remove/.test(lower)) {
      const first = conversation.lastProducts[0];
      if (!first) {
        return {
          type: 'text',
          conversationId: conversation.id,
          message: 'Which wishlist item should I remove?',
        };
      }
      const result = await tools.run('removeFromWishlist', { productId: first.id }, ctx);
      return toolResultToResponse(conversation.id, result);
    }
    const result = await tools.run('getWishlist', {}, ctx);
    return toolResultToResponse(conversation.id, result);
  }

  if (/clear (my )?cart|empty (my )?cart|remove everything/i.test(lower)) {
    const result = await tools.run('clearCart', {}, ctx);
    return toolResultToResponse(conversation.id, result);
  }

  if (/show (my )?cart|my cart|view cart/i.test(lower)) {
    const result = await tools.run('getCart', {}, ctx);
    return toolResultToResponse(conversation.id, result);
  }

  if (/add .*cart|add this|add the first|add to cart/i.test(lower)) {
    let productId = conversation.lastProducts[0]?.id;
    const second = /second/i.test(lower);
    if (second) productId = conversation.lastProducts[1]?.id;
    if (!productId) {
      return {
        type: 'text',
        conversationId: conversation.id,
        message: 'Search for products first, then ask me to add one to your cart.',
      };
    }
    const result = await tools.run('addToCart', { productId, quantity: 1 }, ctx);
    return toolResultToResponse(conversation.id, result);
  }

  if (/remove .*cart|remove (this|the)/i.test(lower) && /cart|item/i.test(lower)) {
    const idx = /second/i.test(lower) ? 1 : 0;
    const productId = conversation.lastProducts[idx]?.id;
    if (!productId) {
      const cart = await tools.run('getCart', {}, ctx);
      if (cart.kind === 'cart' && cart.cart.items[idx]) {
        const result = await tools.run(
          'removeFromCart',
          { productId: cart.cart.items[idx].productId },
          ctx,
        );
        return toolResultToResponse(conversation.id, result);
      }
      return {
        type: 'text',
        conversationId: conversation.id,
        message: 'I could not tell which cart item to remove.',
      };
    }
    const result = await tools.run('removeFromCart', { productId }, ctx);
    return toolResultToResponse(conversation.id, result);
  }

  if (/order|track|shipped|where is my|cancel my order/i.test(lower)) {
    if (/cancel/i.test(lower)) {
      const knowledge = await tools.run(
        'searchKnowledgeBase',
        { query: 'cancel order before shipped' },
        ctx,
      );
      return toolResultToResponse(conversation.id, knowledge);
    }
    const result = await tools.run('trackOrder', {}, ctx);
    return toolResultToResponse(conversation.id, result);
  }

  if (
    /show|find|search|want|looking|gift|merch|ring|earring|desk|hoodie|tee|figure|under|below/i.test(
      lower,
    )
  ) {
    const maxPrice = parsePriceCap(lower);
    const category = detectCategory(lower);
    const search = extractSearchTerms(text);
    const result = await tools.run(
      'searchProducts',
      {
        search,
        category,
        maxPrice,
        limit: 8,
      },
      ctx,
    );
    if (result.kind === 'products') {
      conversation.lastProducts = result.products;
    }
    return toolResultToResponse(conversation.id, result);
  }

  return {
    type: 'text',
    conversationId: conversation.id,
    message:
      "I'm Heimdall — your personal guide and Niðavellir partner. I can help with merch search, cart, wishlist, orders, and policies. Try “Show me desk gear under 3000” or “Show my cart”.",
  };
}

export { toolResultToResponse };
