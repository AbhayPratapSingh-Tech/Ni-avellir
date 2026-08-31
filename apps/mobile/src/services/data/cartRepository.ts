import type { Product } from '@nidavellir/shared';
import type { CartSessionResponse } from '@nidavellir/shared';
import { appConfig } from '../../config/appConfig';
import { apiClient } from '../api/apiClient';
import { normalizeProduct } from '../../lib/productMedia';
import { store } from '../../app/store';
import { setServerQuote, clearCart, setCartItems, type CartItem } from '../../features/cart/cartSlice';

function mapLineProduct(raw: Record<string, unknown>): Product {
  const id = String(raw._id ?? raw.id ?? '');
  const franchise = String(raw.franchise ?? '');
  return normalizeProduct({
    ...(raw as Product),
    id,
    brand: String(raw.brand ?? franchise),
    franchise,
  });
}

function applyCartResponse(data: CartSessionResponse) {
  const items: CartItem[] = data.quote.lines.map((line) => ({
    product: mapLineProduct(line.product as Record<string, unknown>),
    quantity: line.quantity,
    lineTotal: line.lineTotal,
  }));
  store.dispatch(
    setServerQuote({
      subtotal: data.quote.subtotal,
      shipping: data.quote.shipping,
      tax: data.quote.tax,
      total: data.quote.total,
      itemCount: data.quote.itemCount,
      discount: data.quote.discount,
      couponCode: data.cart.couponCode ?? data.quote.couponCode ?? data.quote.coupon?.code,
      couponDiscountType: data.quote.coupon?.discountType,
      couponDiscountValue: data.quote.coupon?.discountValue,
      totalBeforeDiscount: data.quote.totalBeforeDiscount,
    }),
  );
  store.dispatch(setCartItems(items));
}

export const cartRepository = {
  async refresh(pincode?: string) {
    if (appConfig.dataSource !== 'api') return;
    const { data } = await apiClient.get('/cart', { params: { pincode } });
    applyCartResponse(data.data);
  },

  async addItem(productId: string, quantity = 1, pincode?: string) {
    if (appConfig.dataSource !== 'api') return;
    const { data } = await apiClient.post('/cart/items', { productId, quantity }, { params: { pincode } });
    applyCartResponse(data.data);
  },

  async updateItem(productId: string, quantity: number, pincode?: string) {
    if (appConfig.dataSource !== 'api') return;
    const { data } = await apiClient.patch(`/cart/items/${productId}`, { quantity }, { params: { pincode } });
    applyCartResponse(data.data);
  },

  async removeItem(productId: string, pincode?: string) {
    if (appConfig.dataSource !== 'api') return;
    const { data } = await apiClient.delete(`/cart/items/${productId}`, { params: { pincode } });
    applyCartResponse(data.data);
  },

  async merge(guestSessionId: string, pincode?: string) {
    if (appConfig.dataSource !== 'api') return;
    const { data } = await apiClient.post(
      '/cart/merge',
      {},
      { headers: { 'X-Guest-Session': guestSessionId }, params: { pincode } },
    );
    applyCartResponse(data.data);
  },

  async clear() {
    if (appConfig.dataSource !== 'api') return;
    await apiClient.delete('/cart');
    store.dispatch(clearCart());
  },

  async applyCoupon(code: string, pincode?: string) {
    if (appConfig.dataSource !== 'api') return;
    const { data } = await apiClient.post('/cart/apply-coupon', { code }, { params: { pincode } });
    applyCartResponse(data.data);
  },

  async removeCoupon(pincode?: string) {
    if (appConfig.dataSource !== 'api') return;
    const { data } = await apiClient.post('/cart/remove-coupon', {}, { params: { pincode } });
    applyCartResponse(data.data);
  },
};
