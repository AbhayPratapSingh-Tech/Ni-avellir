import type { AuthUser } from '../features/auth/authSlice';
import { openLogin } from '../features/auth/authSlice';
import type { AppDispatch } from '../app/store';

export function isLoggedInUser(user: AuthUser | null | undefined): boolean {
  return Boolean(user && !user.isGuest);
}

type ToastLike = { show: (message: string) => void };

const REASON_MESSAGE = {
  checkout: 'Login required to checkout',
  wishlist: 'Login required to use wishlist',
  review: 'Login required to write a review',
} as const;

/**
 * If the user is a guest (or signed out), prompt login and return false.
 * Returns true when the user may continue.
 */
export function requireLogin(options: {
  user: AuthUser | null | undefined;
  dispatch: AppDispatch;
  toast: ToastLike;
  reason: keyof typeof REASON_MESSAGE;
}): boolean {
  if (isLoggedInUser(options.user)) {
    return true;
  }
  options.toast.show(REASON_MESSAGE[options.reason]);
  options.dispatch(openLogin());
  return false;
}
