import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '@nidavellir/shared';
import { normalizeProduct } from '../../lib/productMedia';

type WishlistState = {
  items: Product[];
};

const initialState: WishlistState = {
  items: [],
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleItem(state, action: PayloadAction<Product>) {
      const product = normalizeProduct(action.payload);
      const index = state.items.findIndex((item) => item.id === product.id);
      if (index >= 0) {
        state.items = state.items.filter((item) => item.id !== product.id);
      } else {
        state.items = [...state.items, product];
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    setWishlist(state, action: PayloadAction<Product[]>) {
      state.items = action.payload.map(normalizeProduct);
    },
  },
});

export const { toggleItem, removeItem, setWishlist } = wishlistSlice.actions;
export const wishlistReducer = wishlistSlice.reducer;
