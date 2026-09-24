import type { Product } from '@nidavellir/shared';
import type { AppDispatch } from '../app/store';
import type { AuthUser } from '../features/auth/authSlice';
import { toggleItem } from '../features/wishlist/wishlistSlice';
import { appConfig } from '../config/appConfig';
import { wishlistRepository } from '../services/data/wishlistRepository';
import { requireLogin } from './authGates';

type ToastLike = { show: (message: string) => void };

/**
 * Heart / wishlist actions — guests must log in first.
 * Logged-in users update Redux and sync to API when live.
 * On API failure, Redux is rolled back so removed items cannot “come back” on next sync.
 */
export async function toggleWishlistForUser(options: {
  product: Product;
  user: AuthUser | null | undefined;
  dispatch: AppDispatch;
  toast: ToastLike;
  currentlyWishlisted: boolean;
}): Promise<boolean> {
  if (
    !requireLogin({
      user: options.user,
      dispatch: options.dispatch,
      toast: options.toast,
      reason: 'wishlist',
    })
  ) {
    return false;
  }

  options.dispatch(toggleItem(options.product));
  options.toast.show(
    options.currentlyWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
  );

  if (appConfig.dataSource === 'api') {
    try {
      await wishlistRepository.toggle(options.product.id);
    } catch {
      // Revert optimistic update so focus-sync cannot resurrect a “removed” item incorrectly,
      // and failed adds do not linger as ghosts.
      options.dispatch(toggleItem(options.product));
      options.toast.show('Could not update wishlist — try again');
      return false;
    }
  }
  return true;
}
