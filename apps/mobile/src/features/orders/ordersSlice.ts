import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type OrderHistoryItem = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  estimatedDelivery: string;
  itemCount: number;
  createdAt: string;
  paymentMethod?: string;
};

type OrdersState = {
  items: OrderHistoryItem[];
};

const initialState: OrdersState = {
  items: [],
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    addOrder(state, action: PayloadAction<OrderHistoryItem>) {
      const exists = state.items.some((item) => item.id === action.payload.id);
      if (!exists) {
        state.items.unshift(action.payload);
      }
    },
    clearOrders(state) {
      state.items = [];
    },
  },
});

export const { addOrder, clearOrders } = ordersSlice.actions;
export const ordersReducer = ordersSlice.reducer;
