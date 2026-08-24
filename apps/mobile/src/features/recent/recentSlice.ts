import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '@nidavellir/shared';

const MAX_RECENT = 12;

type RecentState = {
  items: Product[];
};

const initialState: RecentState = {
  items: [],
};

const recentSlice = createSlice({
  name: 'recent',
  initialState,
  reducers: {
    viewProduct(state, action: PayloadAction<Product>) {
      const next = action.payload;
      state.items = [next, ...state.items.filter((item) => item.id !== next.id)].slice(
        0,
        MAX_RECENT,
      );
    },
  },
});

export const { viewProduct } = recentSlice.actions;
export const recentReducer = recentSlice.reducer;
