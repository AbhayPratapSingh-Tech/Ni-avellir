import { appConfig } from '../../config/appConfig';
import { apiClient } from '../api/apiClient';
import { store } from '../../app/store';
import { setOrders, type OrderHistoryItem } from '../../features/orders/ordersSlice';

function mapOrder(raw: Record<string, unknown>): OrderHistoryItem {
  const items = (raw.items as OrderHistoryItem['items']) ?? [];
  return {
    id: String(raw._id ?? raw.id),
    orderNumber: String(raw.orderNumber),
    status: String(raw.status),
    subtotal: Number(raw.subtotal),
    shipping: Number(raw.shipping),
    tax: Number(raw.tax),
    total: Number(raw.total),
    currency: String(raw.currency ?? 'INR'),
    estimatedDelivery: String(raw.estimatedDelivery),
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    paymentMethod: raw.paymentMethod ? String(raw.paymentMethod) : undefined,
    items,
    shippingAddress: raw.shippingAddress as OrderHistoryItem['shippingAddress'],
  };
}

export const orderRepository = {
  async syncToStore() {
    if (appConfig.dataSource !== 'api') return;
    const { data } = await apiClient.get('/orders');
    store.dispatch(setOrders((data.data.orders as Record<string, unknown>[]).map(mapOrder)));
  },

  async getById(id: string) {
    const { data } = await apiClient.get(`/orders/${id}`);
    return mapOrder(data.data.order);
  },

  async cancel(id: string, reason?: string) {
    const { data } = await apiClient.post(`/orders/${id}/cancel`, { reason });
    await this.syncToStore();
    return mapOrder(data.data.order);
  },

  async requestReturn(id: string, reason: string) {
    const { data } = await apiClient.post(`/orders/${id}/return`, { reason });
    return mapOrder(data.data.order);
  },

  async requestExchange(id: string, reason: string) {
    const { data } = await apiClient.post(`/orders/${id}/exchange`, { reason });
    return mapOrder(data.data.order);
  },
};
