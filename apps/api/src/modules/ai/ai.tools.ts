import type {
  AICartPayload,
  AIOrderPayload,
  AIProductCard,
  AIWishlistPayload,
} from '@nidavellir/shared';
import { AppError } from '../../common/errors/app-error.js';
import { CartService } from '../cart/cart.service.js';
import { OrderService } from '../orders/order.service.js';
import { ProductService } from '../products/product.service.js';
import { WishlistService } from '../wishlist/wishlist.service.js';
import { searchKnowledgeBase } from './ai.knowledge.js';
import { toAiProduct } from './ai.serialize.js';

export type AiToolContext = {
  userId?: string;
  guestSessionId?: string;
};

export type ToolResult =
  | { kind: 'products'; products: AIProductCard[]; message: string }
  | { kind: 'product'; product: AIProductCard; message: string }
  | { kind: 'cart'; cart: AICartPayload; message: string }
  | { kind: 'wishlist'; wishlist: AIWishlistPayload; message: string }
  | { kind: 'order'; order: AIOrderPayload; message: string }
  | { kind: 'orders'; orders: AIOrderPayload[]; message: string }
  | { kind: 'knowledge'; snippets: Array<{ source: string; text: string }>; message: string }
  | { kind: 'text'; message: string }
  | { kind: 'error'; message: string; code?: string };

function requireUser(ctx: AiToolContext) {
  if (!ctx.userId) {
    throw new AppError('Please sign in to do that.', 401);
  }
  return ctx.userId;
}

function mapOrder(raw: Record<string, unknown>): AIOrderPayload {
  const items = Array.isArray(raw.items) ? raw.items : [];
  return {
    id: String(raw._id ?? raw.id ?? ''),
    orderNumber: String(raw.orderNumber ?? ''),
    status: String(raw.status ?? ''),
    total: Number(raw.total ?? 0),
    currency: String(raw.currency ?? 'INR'),
    estimatedDelivery: raw.estimatedDelivery ? String(raw.estimatedDelivery) : undefined,
    itemCount: items.reduce(
      (sum: number, item: { quantity?: number }) => sum + Number(item.quantity ?? 0),
      0,
    ),
    items: items.map((item: { name?: string; quantity?: number; lineTotal?: number }) => ({
      name: String(item.name ?? ''),
      quantity: Number(item.quantity ?? 0),
      lineTotal: Number(item.lineTotal ?? 0),
    })),
  };
}

function mapCartQuote(quote: {
  lines: Array<{ product: { _id?: unknown; name?: string; price?: number; imageUrl?: string }; quantity: number; lineTotal: number }>;
  itemCount: number;
  subtotal: number;
  total: number;
}): AICartPayload {
  return {
    items: quote.lines.map((line) => ({
      productId: String(line.product._id ?? ''),
      name: String(line.product.name ?? ''),
      quantity: line.quantity,
      unitPrice: Number(line.product.price ?? 0),
      lineTotal: line.lineTotal,
      imageUrl: line.product.imageUrl ? String(line.product.imageUrl) : undefined,
    })),
    itemCount: quote.itemCount,
    subtotal: quote.subtotal,
    total: quote.total,
    currency: 'INR',
  };
}

export const aiToolDefinitions = [
  {
    type: 'function' as const,
    function: {
      name: 'searchProducts',
      description: 'Search the live Niðavellir merch catalog. Never invent products.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          category: {
            type: 'string',
            enum: ['collectibles', 'apparel', 'desk-gear', 'limited-drops'],
          },
          franchise: { type: 'string' },
          minPrice: { type: 'number' },
          maxPrice: { type: 'number' },
          limit: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getProductDetails',
      description: 'Get one product by slug or id from the live catalog.',
      parameters: {
        type: 'object',
        properties: {
          slugOrId: { type: 'string' },
        },
        required: ['slugOrId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getCart',
      description: 'Show the current user or guest cart.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'addToCart',
      description: 'Add a product to cart by product id.',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          quantity: { type: 'number' },
        },
        required: ['productId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'removeFromCart',
      description: 'Remove a product from cart.',
      parameters: {
        type: 'object',
        properties: { productId: { type: 'string' } },
        required: ['productId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'updateCartQuantity',
      description: 'Set cart line quantity for a product.',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          quantity: { type: 'number' },
        },
        required: ['productId', 'quantity'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'clearCart',
      description: 'Remove all items from the cart.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getWishlist',
      description: 'Show wishlist for the signed-in user.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'addToWishlist',
      description: 'Add product to wishlist (signed-in).',
      parameters: {
        type: 'object',
        properties: { productId: { type: 'string' } },
        required: ['productId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'removeFromWishlist',
      description: 'Remove product from wishlist (signed-in).',
      parameters: {
        type: 'object',
        properties: { productId: { type: 'string' } },
        required: ['productId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getOrders',
      description: 'List recent orders for the signed-in user.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getOrderDetails',
      description: 'Get one order by id; ownership is enforced.',
      parameters: {
        type: 'object',
        properties: { orderId: { type: 'string' } },
        required: ['orderId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'trackOrder',
      description: 'Track latest or specific order status for the signed-in user.',
      parameters: {
        type: 'object',
        properties: { orderId: { type: 'string' } },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'searchKnowledgeBase',
      description: 'Search FAQ, returns, and shipping policy docs. Do not invent policy.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  },
];

export class AiTools {
  private readonly products = new ProductService();
  private readonly cart = new CartService();
  private readonly wishlist = new WishlistService();
  private readonly orders = new OrderService();

  async run(
    name: string,
    args: Record<string, unknown>,
    ctx: AiToolContext,
  ): Promise<ToolResult> {
    try {
      switch (name) {
        case 'searchProducts': {
          const result = await this.products.list({
            search: args.search ? String(args.search) : undefined,
            category: args.category ? String(args.category) : undefined,
            franchise: args.franchise ? String(args.franchise) : undefined,
            minPrice: args.minPrice !== undefined ? Number(args.minPrice) : undefined,
            maxPrice: args.maxPrice !== undefined ? Number(args.maxPrice) : undefined,
            limit: args.limit !== undefined ? Number(args.limit) : 8,
            inStockOnly: false,
          });
          const products = result.items.map((item) => toAiProduct(item as never));
          return {
            kind: 'products',
            products,
            message:
              products.length > 0
                ? `I found ${products.length} product${products.length === 1 ? '' : 's'}.`
                : 'I could not find matching products. Try a different search.',
          };
        }
        case 'getProductDetails': {
          const key = String(args.slugOrId ?? '');
          let doc = await this.products.getBySlug(key);
          if (!doc) {
            const { Product } = await import('../products/product.model.js');
            doc = await Product.findById(key).lean();
          }
          if (!doc) {
            return { kind: 'error', message: 'That product was not found.', code: 'product_not_found' };
          }
          const product = toAiProduct(doc as never);
          return { kind: 'product', product, message: `Here is ${product.name}.` };
        }
        case 'getCart': {
          const session = await this.cart.getCart(ctx.userId, ctx.guestSessionId);
          const cart = mapCartQuote(session.quote as never);
          return {
            kind: 'cart',
            cart,
            message:
              cart.itemCount > 0
                ? `Your cart has ${cart.itemCount} item${cart.itemCount === 1 ? '' : 's'}.`
                : 'Your cart is empty.',
          };
        }
        case 'addToCart': {
          const productId = String(args.productId ?? '');
          const quantity = Math.max(1, Number(args.quantity ?? 1));
          const session = await this.cart.addItem(
            ctx.userId,
            ctx.guestSessionId,
            productId,
            quantity,
          );
          const cart = mapCartQuote(session.quote as never);
          return { kind: 'cart', cart, message: 'Added to your cart.' };
        }
        case 'removeFromCart': {
          const productId = String(args.productId ?? '');
          const session = await this.cart.removeItem(ctx.userId, ctx.guestSessionId, productId);
          const cart = mapCartQuote(session.quote as never);
          return { kind: 'cart', cart, message: 'Removed from your cart.' };
        }
        case 'updateCartQuantity': {
          const productId = String(args.productId ?? '');
          const quantity = Number(args.quantity ?? 1);
          const session = await this.cart.updateItem(
            ctx.userId,
            ctx.guestSessionId,
            productId,
            quantity,
          );
          const cart = mapCartQuote(session.quote as never);
          return { kind: 'cart', cart, message: 'Updated cart quantity.' };
        }
        case 'clearCart': {
          await this.cart.clearCart(ctx.userId, ctx.guestSessionId);
          return {
            kind: 'cart',
            cart: { items: [], itemCount: 0, subtotal: 0, total: 0, currency: 'INR' },
            message: 'Your cart is now empty.',
          };
        }
        case 'getWishlist': {
          const userId = requireUser(ctx);
          const list = await this.wishlist.get(userId);
          const products = list.products.map((p) => toAiProduct(p as never));
          return {
            kind: 'wishlist',
            wishlist: { productIds: list.productIds.map(String), products },
            message:
              products.length > 0
                ? `You have ${products.length} wishlist item${products.length === 1 ? '' : 's'}.`
                : 'Your wishlist is empty.',
          };
        }
        case 'addToWishlist': {
          const userId = requireUser(ctx);
          const productId = String(args.productId ?? '');
          await this.wishlist.toggle(userId, productId);
          const list = await this.wishlist.get(userId);
          const products = list.products.map((p) => toAiProduct(p as never));
          return {
            kind: 'wishlist',
            wishlist: { productIds: list.productIds.map(String), products },
            message: 'Updated your wishlist.',
          };
        }
        case 'removeFromWishlist': {
          const userId = requireUser(ctx);
          const productId = String(args.productId ?? '');
          await this.wishlist.remove(userId, productId);
          const list = await this.wishlist.get(userId);
          const products = list.products.map((p) => toAiProduct(p as never));
          return {
            kind: 'wishlist',
            wishlist: { productIds: list.productIds.map(String), products },
            message: 'Removed from your wishlist.',
          };
        }
        case 'getOrders': {
          const userId = requireUser(ctx);
          const rows = await this.orders.list(userId);
          const orders = rows.slice(0, 5).map((row) => mapOrder(row as never));
          return {
            kind: 'orders',
            orders,
            message:
              orders.length > 0
                ? `Here are your latest ${orders.length} order${orders.length === 1 ? '' : 's'}.`
                : 'You have no orders yet.',
          };
        }
        case 'getOrderDetails':
        case 'trackOrder': {
          const userId = requireUser(ctx);
          const orderId = args.orderId ? String(args.orderId) : undefined;
          if (orderId) {
            const row = await this.orders.getById(orderId, userId);
            const order = mapOrder(row as never);
            return {
              kind: 'order',
              order,
              message: `Order ${order.orderNumber} is currently ${order.status}.`,
            };
          }
          const rows = await this.orders.list(userId);
          if (!rows.length) {
            return { kind: 'text', message: 'You have no orders to track yet.' };
          }
          const order = mapOrder(rows[0] as never);
          return {
            kind: 'order',
            order,
            message: `Your latest order ${order.orderNumber} is ${order.status}.`,
          };
        }
        case 'searchKnowledgeBase': {
          const query = String(args.query ?? '');
          const snippets = searchKnowledgeBase(query);
          if (!snippets.length) {
            return {
              kind: 'text',
              message:
                'I do not have enough policy information for that. Please check FAQ / Returns in the app or contact Support.',
            };
          }
          return {
            kind: 'knowledge',
            snippets,
            message: snippets.map((s) => s.text).join('\n\n'),
          };
        }
        default:
          return { kind: 'error', message: 'Unknown action.', code: 'unknown_tool' };
      }
    } catch (error) {
      if (error instanceof AppError) {
        return { kind: 'error', message: error.message, code: String(error.statusCode) };
      }
      return {
        kind: 'error',
        message: 'Sorry, something went wrong. Please try again.',
        code: 'tool_failed',
      };
    }
  }
}
