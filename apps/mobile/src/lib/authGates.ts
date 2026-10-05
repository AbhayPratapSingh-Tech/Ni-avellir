import type { AuthUser } from '../features/auth/authSlice';
import { openLogin } from '../features/auth/authSlice';
import type { AppDispatch } from '../app/store';
import type { MainTabParamList } from '../app/navigation/types';

export function isLoggedInUser(user: AuthUser | null | undefined): boolean {
  return Boolean(user && !user.isGuest);
}

type ToastLike = { show: (message: string) => void };

const REASON_MESSAGE = {
  checkout: 'Login required to checkout',
  wishlist: 'Login required to use wishlist',
  review: 'Login required to write a review',
  editProfile: 'Login to edit your profile',
  changePassword: 'Login to change your password',
  verifyEmail: 'Login to verify email',
  addresses: 'Login to manage addresses',
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
  /** After Login back / success remount, restore this tab (e.g. Cart). */
  returnTab?: keyof MainTabParamList;
}): boolean {
  if (isLoggedInUser(options.user)) {
    return true;
  }
  options.toast.show(REASON_MESSAGE[options.reason]);
  options.dispatch(openLogin({ returnTab: options.returnTab }));
  return false;
}
