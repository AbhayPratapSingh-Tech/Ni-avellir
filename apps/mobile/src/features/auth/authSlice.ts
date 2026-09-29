import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { appConfig } from '../../config/appConfig';
import { authRepository } from '../../services/data/authRepository';
import { clearSessionTokens } from '../../services/api/sessionTokens';
import { clearAccountScopedStores } from '../../services/session/clearAccountScopedStores';
import type { MainTabParamList } from '../../app/navigation/types';

export type AuthUser = {
  name: string;
  email: string;
  phone: string;
  /** Local file URI or remote avatar URL. */
  avatarUri?: string;
  /** Loyalty points earned from orders. */
  runeXp?: number;
  emailVerified?: boolean;
  isGuest: boolean;
};

type AuthState = {
  user: AuthUser | null;
  /** When true, Auth stack opens on Login instead of Onboarding. */
  startOnLogin: boolean;
  /**
   * After Login cancel (re-enter guest) or successful auth remounts Shop,
   * open this main tab instead of defaulting to Home.
   */
  returnTab: keyof MainTabParamList | null;
};

type ProfileUpdate = Omit<Partial<Omit<AuthUser, 'isGuest'>>, 'avatarUri'> & {
  /** Pass `null` to clear the photo. */
  avatarUri?: string | null;
};

export type OpenLoginPayload = {
  returnTab?: keyof MainTabParamList;
};

const initialState: AuthState = {
  user: null,
  startOnLogin: false,
  returnTab: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    enterGuest(state) {
      const keepReturnTab = state.startOnLogin;
      state.user = {
        name: 'Guest',
        email: '',
        phone: '',
        isGuest: true,
      };
      state.startOnLogin = false;
      if (!keepReturnTab) {
        state.returnTab = null;
      }
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
      if (action.payload.runeXp !== undefined) {
        next.runeXp = action.payload.runeXp;
      }
      if (action.payload.emailVerified !== undefined) {
        next.emailVerified = action.payload.emailVerified;
      }
      state.user = next;
    },
    openLogin(state, action: PayloadAction<OpenLoginPayload | undefined>) {
      state.user = null;
      state.startOnLogin = true;
      state.returnTab = action.payload?.returnTab ?? null;
    },
    clearReturnTab(state) {
      state.returnTab = null;
    },
    signOut(state) {
      state.user = null;
      state.startOnLogin = false;
      state.returnTab = null;
    },
  },
});

export const { enterGuest, signIn, updateProfile, openLogin, clearReturnTab, signOut } =
  authSlice.actions;
export const authReducer = authSlice.reducer;

/** Call from UI instead of bare `signOut` so live API tokens clear too.
 * Returns the user to the shop as guest (does not dump onto Onboarding).
 */
export function signOutAndClearSession() {
  if (appConfig.dataSource === 'api') {
    void authRepository.logout();
  } else {
    clearSessionTokens();
  }
  clearAccountScopedStores();
  return enterGuest();
}
