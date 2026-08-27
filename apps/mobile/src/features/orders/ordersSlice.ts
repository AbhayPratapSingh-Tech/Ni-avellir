import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type OrderLineItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  lineTotal: number;
};

export type OrderShippingAddress = {
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
};

export type OrderHistoryItem = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  estimatedDelivery: string;
  itemCount: number;
  createdAt: string;
  paymentMethod?: string;
  items: OrderLineItem[];
  shippingAddress?: OrderShippingAddress;
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
