import { Notification } from './notification.model.js';

export class NotificationService {
  async list(userId: string) {
    return Notification.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
  }

  async markRead(userId: string, id: string) {
    await Notification.updateOne({ _id: id, userId }, { read: true });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await Notification.updateMany({ userId, read: false }, { read: true });
    return { ok: true };
  }

  async create(userId: string, input: { type: string; title: string; body: string; metadata?: Record<string, unknown> }) {
    return Notification.create({ userId, ...input, read: false });
  }

  async notifyOrderEvent(userId: string, type: string, orderNumber: string) {
    const titles: Record<string, string> = {
      order_placed: 'Order placed',
      order_shipped: 'Order shipped',
      out_for_delivery: 'Out for delivery',
      delivered: 'Delivered',
      cancelled: 'Order cancelled',
      refund: 'Refund initiated',
      offer: 'New offer for you',
    };
    return this.create(userId, {
      type,
      title: titles[type] ?? 'Order update',
      body: `Update for order ${orderNumber}`,
      metadata: { orderNumber },
    });
  }
}

export const notificationService = new NotificationService();
