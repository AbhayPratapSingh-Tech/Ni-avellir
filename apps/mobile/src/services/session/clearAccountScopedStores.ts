import { store } from '../../app/store';
import { setAddresses } from '../../features/addresses/addressesSlice';
import { clearOrders } from '../../features/orders/ordersSlice';
import { setWishlist } from '../../features/wishlist/wishlistSlice';

/** Drop account-scoped Redux when signing out so the next session starts clean. */
export function clearAccountScopedStores() {
  store.dispatch(clearOrders());
  store.dispatch(setAddresses([]));
  store.dispatch(setWishlist([]));
}
