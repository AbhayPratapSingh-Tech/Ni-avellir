import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '@nidavellir/shared';

export interface CartItem {
  product: Product;
  quantity: number;
  lineTotal: number;
}

export interface CartState {
  items: CartItem[];
  /** Client-side computed totals (replaced by server quote in api mode). */
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}

const initialState: CartState = {
  items: [],
  subtotal: 0,
  shipping: 0,
  tax: 0,
  total: 0,
  itemCount: 0,
};

function recomputeTotals(state: CartState) {
  state.subtotal = state.items.reduce((sum, item) => sum + item.lineTotal, 0);
  state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  state.shipping = state.subtotal >= 1499 || state.subtotal === 0 ? 0 : 99;
  state.tax = Math.round(state.subtotal * 0.05);
  state.total = state.subtotal + state.shipping + state.tax;
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<{ product: Product; quantity?: number }>) {
      const { product, quantity = 1 } = action.payload;
      const existing = state.items.find((item) => item.product.id === product.id);
      if (existing) {
        existing.quantity += quantity;
        existing.lineTotal = existing.product.price * existing.quantity;
      } else {
        state.items.push({
          product,
          quantity,
          lineTotal: product.price * quantity,
        });
      }
      recomputeTotals(state);
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.product.id !== action.payload);
      recomputeTotals(state);
    },
    updateQuantity(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      const item = state.items.find((i) => i.product.id === action.payload.productId);
      if (!item) return;
      if (action.payload.quantity <= 0) {
        state.items = state.items.filter((i) => i.product.id !== action.payload.productId);
      } else {
        item.quantity = action.payload.quantity;
        item.lineTotal = item.product.price * item.quantity;
      }
      recomputeTotals(state);
    },
    setServerQuote(
      state,
      action: PayloadAction<{ subtotal: number; shipping: number; tax: number; total: number; itemCount: number }>,
    ) {
      state.subtotal = action.payload.subtotal;
      state.shipping = action.payload.shipping;
      state.tax = action.payload.tax;
      state.total = action.payload.total;
      state.itemCount = action.payload.itemCount;
    },
    clearCart(state) {
      state.items = [];
      state.subtotal = 0;
      state.shipping = 0;
      state.tax = 0;
      state.total = 0;
      state.itemCount = 0;
    },
  },
});

export const { addItem, removeItem, updateQuantity, setServerQuote, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
