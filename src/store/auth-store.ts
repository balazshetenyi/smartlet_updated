import { Session } from "@supabase/supabase-js";
import { create } from "zustand";

type AuthStore = {
  isLoggedIn: boolean;
  session: Session | null;
  profile?: UserProfile | null;
  loading?: boolean;
};

type AuthActions = {
  signIn?: (data: SignInData) => Promise<{ success: boolean; error?: string }>;
  signOut?: () => Promise<void>;
  signUpWithEmail?: (
    data: SignUpData
  ) => Promise<{ success: boolean; error?: string }>;
  refreshProfile?: () => Promise<UserProfile | null> | null;
};

export const useAuthStore = create<AuthStore & AuthActions>((set) => ({
  isLoggedIn: false,
  session: null,
  profile: null,
  loading: true,
  signIn: async (data: SignInData) => {
    // Implementation of signIn
    return { success: false };
  },
  signOut: async () => {
    // Implementation of signOut
  },
  signUpWithEmail: async (data: SignUpData) => {
    // Implementation of signUpWithEmail
    return { success: false };
  },
  refreshProfile: async () => {
    // Implementation of refreshProfile
    return null;
  },
}));
