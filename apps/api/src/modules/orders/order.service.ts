import { nanoid } from 'nanoid';
import { AppError } from '../../common/errors/app-error.js';
import { notificationService } from '../notifications/notification.service.js';
import { Product } from '../products/product.model.js';
import { serviceabilityService } from '../serviceability/serviceability.service.js';
import { sendOrderStatusEmail } from './order-email.js';
import { Order } from './order.model.js';

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
};

type LeanOrderProduct = {
  _id: unknown;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
};

export class OrderService {
  async create(input: CreateOrderInput, userId?: string) {
    const productIds = input.items.map((item) => item.productId);
    const products = (await Product.find({ _id: { $in: productIds } }).lean()) as LeanOrderProduct[];
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    const items = input.items.map((item) => {
      const product = productMap.get(String(item.productId));
      if (!product) {
        throw new AppError(`Product not found: ${item.productId}`, 404);
      }
      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for ${product.name}`, 422);
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
    const order = await Order.create({
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
    });

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

    if (isCod) {
      await Promise.all(
        items.map((item) =>
          Product.updateOne({ _id: item.productId }, { $inc: { stock: -item.quantity } }),
        ),
      );
    }

    return order;
  }

  async list(userId?: string, email?: string) {
    const filter: Record<string, unknown> = {};
    if (userId) filter.userId = userId;
    else if (email) filter['customer.email'] = email;
    return Order.find(filter).sort({ createdAt: -1 }).lean();
  }

  async getById(id: string, userId?: string) {
    const order = await Order.findById(id).lean();
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    if (userId && order.userId && String(order.userId) !== userId) {
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
    order.status = 'cancelled';
    order.cancelReason = reason;
    await order.save();
    if (order.userId) {
      await notificationService.notifyOrderEvent(String(order.userId), 'cancelled', order.orderNumber);
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
