import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '@nidavellir/shared';
import { normalizeProduct } from '../../lib/productMedia';
import { productMatchesCatalogId } from '../../services/data/productRepository';

type WishlistState = {
  items: Product[];
};

const initialState: WishlistState = {
  items: [],
};

function sameProduct(a: Product, b: Product) {
  return productMatchesCatalogId(a, b.id) || productMatchesCatalogId(b, a.id);
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleItem(state, action: PayloadAction<Product>) {
      const product = normalizeProduct(action.payload);
      const index = state.items.findIndex((item) => sameProduct(item, product));
      if (index >= 0) {
        state.items = state.items.filter((item) => !sameProduct(item, product));
      } else {
        state.items = [...state.items, product];
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      const ref = action.payload;
      state.items = state.items.filter((item) => !productMatchesCatalogId(item, ref));
    },
    setWishlist(state, action: PayloadAction<Product[]>) {
      // Dedupe by canonical id in case API ever returns overlaps.
      const next: Product[] = [];
      const seen = new Set<string>();
      for (const raw of action.payload) {
        const product = normalizeProduct(raw);
        if (seen.has(product.id)) continue;
        seen.add(product.id);
        next.push(product);
      }
      state.items = next;
    },
  },
});

export const { toggleItem, removeItem, setWishlist } = wishlistSlice.actions;
export const wishlistReducer = wishlistSlice.reducer;
