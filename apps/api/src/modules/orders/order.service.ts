import { nanoid } from 'nanoid';
import { AppError } from '../../common/errors/app-error.js';
import { notificationService } from '../notifications/notification.service.js';
import { Product } from '../products/product.model.js';
import { serviceabilityService } from '../serviceability/serviceability.service.js';
import { releaseStock, reserveStock } from './inventory.js';
import { sendOrderStatusEmail } from './order-email.js';
import { Order } from './order.model.js';
import { awardOrderRuneXp } from './rune-xp.js';

export type CreateOrderInput = {
  customer: { name: string; email: string; phone: string };
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  paymentMethod: string;
  discount?: number;
  couponCode?: string;
  /** Optional body fallback; prefer Idempotency-Key header. */
  idempotencyKey?: string;
};

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: number }).code === 11000,
  );
}

type LeanOrderProduct = {
  _id: unknown;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
};

async function notifyCancelled(order: {
  userId?: unknown;
  orderNumber: string;
  customer: { email: string };
  total: number;
}) {
  if (order.userId) {
    await notificationService.notifyOrderEvent(
      String(order.userId),
      'cancelled',
      order.orderNumber,
    );
  }
  try {
    await sendOrderStatusEmail({
      to: order.customer.email,
      orderNumber: order.orderNumber,
      status: 'cancelled',
      total: order.total,
    });
  } catch {
    // ignore
  }
}

export class OrderService {
  async create(input: CreateOrderInput, userId?: string, idempotencyKey?: string) {
    const key = (idempotencyKey ?? input.idempotencyKey)?.trim() || undefined;

    if (key) {
      const existing = await Order.findOne({ idempotencyKey: key });
      if (existing) {
        if (userId && existing.userId && String(existing.userId) !== userId) {
          throw new AppError('Idempotency key already used by another account', 409);
        }
        return {
          order: existing,
          awardedXp: Number(existing.runeXpAwarded ?? 0),
          replayed: true as const,
        };
      }
    }

    const productIds = input.items.map((item) => item.productId);
    const products = (await Product.find({ _id: { $in: productIds } }).lean()) as LeanOrderProduct[];
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    const items = input.items.map((item) => {
      const product = productMap.get(String(item.productId));
      if (!product) {
        throw new AppError(`Product not found: ${item.productId}`, 404);
      }
      return {
        productId: String(product._id),
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        imageUrl: product.imageUrl,
        lineTotal: product.price * item.quantity,
      };
    });

    // Atomic hold before create (COD sale or Razorpay pending). Idempotent replay skips this.
    await reserveStock(
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        name: item.name,
      })),
    );

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const discount = input.discount ?? 0;
    const serviceability = await serviceabilityService.resolve(input.shippingAddress.postalCode);
    const afterDiscount = Math.max(0, subtotal - discount);
    const shipping =
      afterDiscount >= serviceability.freeShippingThreshold ? 0 : serviceability.shippingCharge;
    const tax = Math.round(afterDiscount * 0.05);
    const total = afterDiscount + shipping + tax;

    const orderNumber = `ORD-${nanoid(8).toUpperCase()}`;
    const estimatedDelivery = new Date(Date.now() + serviceability.etaDays * 86400000)
      .toISOString()
      .slice(0, 10);

    const isCod = input.paymentMethod === 'cash_on_delivery';
    const payload = {
      userId,
      orderNumber,
      customer: input.customer,
      items,
      shippingAddress: input.shippingAddress,
      paymentMethod: input.paymentMethod,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      currency: 'INR',
      status: isCod ? 'confirmed' : 'pending_payment',
      estimatedDelivery,
      idempotencyKey: key,
      runeXpAwarded: 0,
    };

    let order;
    try {
      order = await Order.create(payload);
    } catch (error) {
      if (key && isDuplicateKeyError(error)) {
        // Concurrent create with same key — this request's reserve is extra; release it.
        await releaseStock(
          items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        );
        const existing = await Order.findOne({ idempotencyKey: key });
        if (existing) {
          return {
            order: existing,
            awardedXp: Number(existing.runeXpAwarded ?? 0),
            replayed: true as const,
          };
        }
      }
      await releaseStock(
        items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      );
      throw error;
    }

    if (userId) {
      await notificationService.notifyOrderEvent(String(userId), 'order_placed', orderNumber);
    }
    try {
      await sendOrderStatusEmail({
        to: input.customer.email,
        orderNumber,
        status: order.status,
        total,
      });
    } catch {
      // email failure must not block checkout
    }

    let awardedXp = 0;
    if (isCod) {
      awardedXp = await awardOrderRuneXp(
        userId,
        items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      );
      order.runeXpAwarded = awardedXp;
      await order.save();
    }

    return { order, awardedXp, replayed: false as const };
  }

  async list(userId: string) {
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }
    return Order.find({
      userId,
      // Abandoned Razorpay checkouts stay pending_payment — hide from My Orders.
      status: { $nin: ['pending_payment'] },
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  async getById(id: string, userId: string) {
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }
    const order = await Order.findById(id).lean();
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    if (!order.userId || String(order.userId) !== userId) {
      throw new AppError('Forbidden', 403);
    }
    return order;
  }

  async cancel(id: string, userId: string | undefined, reason?: string) {
    const order = await Order.findById(id);
    if (!order) throw new AppError('Order not found', 404);
    if (userId && String(order.userId) !== userId) {
      throw new AppError('Forbidden', 403);
    }
    if (['cancelled', 'delivered', 'shipped'].includes(order.status)) {
      throw new AppError('Order cannot be cancelled', 422);
    }

    // Unpaid hold: claim pending → cancelled then release reserved stock once.
    if (order.status === 'pending_payment') {
      const claimed = await Order.findOneAndUpdate(
        { _id: id, status: 'pending_payment' },
        { $set: { status: 'cancelled', cancelReason: reason ?? 'user_cancelled' } },
        { new: true },
      );
      if (!claimed) {
        throw new AppError('Order cannot be cancelled', 422);
      }
      await releaseStock(
        claimed.items.map((item) => ({
          productId: String(item.productId),
          quantity: item.quantity,
        })),
      );
      await notifyCancelled(claimed);
      return claimed;
    }

    // Paid / confirmed (etc.): cancel without restoring stock (refunds out of scope).
    order.status = 'cancelled';
    order.cancelReason = reason;
    await order.save();
    await notifyCancelled(order);
    return order;
  }

  async requestReturn(id: string, userId: string | undefined, reason: string) {
    const order = await Order.findById(id);
    if (!order) throw new AppError('Order not found', 404);
    if (userId && String(order.userId) !== userId) throw new AppError('Forbidden', 403);
    order.returnRequest = { reason, status: 'requested', requestedAt: new Date() };
    await order.save();
    return order;
  }

  async requestExchange(id: string, userId: string | undefined, reason: string) {
    const order = await Order.findById(id);
    if (!order) throw new AppError('Order not found', 404);
    if (userId && String(order.userId) !== userId) throw new AppError('Forbidden', 403);
    order.exchangeRequest = { reason, status: 'requested', requestedAt: new Date() };
    await order.save();
    return order;
  }
}
