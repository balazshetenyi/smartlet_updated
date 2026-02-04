import { SignInData, SignUpData } from "@/types/auth";
import {
  fetchUserProfile,
  signInWithEmail,
  signOutUser,
} from "@/utils/auth-utils";
import { Session } from "@supabase/supabase-js";
import { create } from "zustand";

type AuthStore = {
  isLoggedIn: boolean;
  session: Session | null;
  profile?: UserProfile | null;
  loading: boolean;
  signingOut: boolean;
};

type AuthActions = {
  signIn: (data: SignInData) => Promise<void>;
  signOut: () => Promise<void>;
  signUpWithEmail: (
    data: SignUpData,
  ) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  setSession: (session: Session | null) => void;
  loadProfile: (userId: string) => Promise<void>;
};

export const useAuthStore = create<AuthStore & AuthActions>((set, get) => ({
  isLoggedIn: false,
  session: null,
  profile: null,
  loading: true,
  signingOut: false,

  setSession: (session) => {
    set({
      session,
      isLoggedIn: !!session,
      loading: false,
    });
  },

  loadProfile: async (userId) => {
    const profile = await fetchUserProfile(userId);
    set({ profile: profile ?? null });
  },

  signIn: async (data) => {
    set({ loading: true });
    await signInWithEmail(data); // auth listener + setSession will populate session/profile
  },

  signOut: async () => {
    set({ signingOut: true });
    await signOutUser(); // auth listener will clear session/profile
    set({ signingOut: false });
  },

  signUpWithEmail: async (_data) => {},

  refreshProfile: async () => {
    const userId = get().session?.user?.id;
    if (!userId) return;
    const profile = await fetchUserProfile(userId);
    set({ profile: profile ?? null });
  },
}));
