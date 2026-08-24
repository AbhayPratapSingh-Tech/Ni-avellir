import { configureStore } from '@reduxjs/toolkit';
import { useSelector, useDispatch, type TypedUseSelectorHook } from 'react-redux';
import cartReducer from '../../features/cart/cartSlice';
import { wishlistReducer } from '../../features/wishlist/wishlistSlice';
import { recentReducer } from '../../features/recent/recentSlice';
import { authReducer } from '../../features/auth/authSlice';
import { ordersReducer } from '../../features/orders/ordersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    recent: recentReducer,
    orders: ordersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
