import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { clearSessionTokens } from '../../services/api/sessionTokens';

export type AuthUser = {
  name: string;
  email: string;
  phone: string;
  /** Local file URI or remote avatar URL. */
  avatarUri?: string;
  isGuest: boolean;
};

type AuthState = {
  user: AuthUser | null;
  /** When true, Auth stack opens on Login instead of Onboarding. */
  startOnLogin: boolean;
};

type ProfileUpdate = Omit<Partial<Omit<AuthUser, 'isGuest'>>, 'avatarUri'> & {
  /** Pass `null` to clear the photo. */
  avatarUri?: string | null;
};

const initialState: AuthState = {
  user: null,
  startOnLogin: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    enterGuest(state) {
      state.user = {
        name: 'Guest',
        email: '',
        phone: '',
        isGuest: true,
      };
      state.startOnLogin = false;
    },
    signIn(state, action: PayloadAction<Omit<AuthUser, 'isGuest'>>) {
      state.user = { ...action.payload, isGuest: false };
      state.startOnLogin = false;
    },
    updateProfile(state, action: PayloadAction<ProfileUpdate>) {
      if (!state.user) {
        return;
      }
      const next = {
        ...state.user,
        name: action.payload.name?.trim() || state.user.name,
        email: action.payload.email?.trim() ?? state.user.email,
        phone: action.payload.phone?.trim() ?? state.user.phone,
        isGuest: false,
      };
      if (action.payload.avatarUri !== undefined) {
        next.avatarUri = action.payload.avatarUri || undefined;
      }
      state.user = next;
    },
    openLogin(state) {
      state.user = null;
      state.startOnLogin = true;
    },
    signOut(state) {
      state.user = null;
      state.startOnLogin = false;
    },
  },
});

export const { enterGuest, signIn, updateProfile, openLogin, signOut } = authSlice.actions;
export const authReducer = authSlice.reducer;

/** Call from UI instead of bare `signOut` so live API tokens clear too.
 * Returns the user to the shop as guest (does not dump onto Onboarding).
 */
export function signOutAndClearSession() {
  clearSessionTokens();
  return enterGuest();
}
