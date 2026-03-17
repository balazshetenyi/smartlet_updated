import { SignInData, SignUpData } from "@kiado/shared/types/auth";
import { UserProfile } from "@kiado/shared/types/user";
import {
  fetchUserProfile,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
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
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
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
    try {
      await signInWithEmail(data);
      // The onAuthStateChange listener in _layout.tsx will call setSession
      // and loadProfile. We don't need to do it here, but we do need to
      // ensure loading is cleared if the listener never fires (e.g. error).
    } catch (e) {
      console.error("[signIn] error:", e);
    } finally {
      // The listener sets loading: false itself, but guard against it not firing.
      set((state) => ({ loading: state.loading ? false : state.loading }));
    }
  },

  signOut: async () => {
    set({ signingOut: true });
    try {
      await signOutUser();
    } catch (e) {
      console.error("[signOut] error:", e);
    } finally {
      set({ signingOut: false });
    }
  },

  signUpWithEmail: async (_data) => {
    set({ loading: true });
    try {
      return await signUpWithEmail(_data);
    } catch (e) {
      console.error("[signUpWithEmail] error:", e);
      return { success: false, error: "An unexpected error occurred." };
    } finally {
      set({ loading: false });
    }
  },

  refreshProfile: async () => {
    const userId = get().session?.user?.id;
    if (!userId) return;
    const profile = await fetchUserProfile(userId);
    set({ profile: profile ?? null });
  },

  deleteAccount: async () => {
    set({ loading: true });
    try {
      const session = get().session;
      if (!session?.access_token) {
        return { success: false, error: "Not authenticated" };
      }

      const functionsUrl = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
      const response = await fetch(`${functionsUrl}/delete-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const json = await response.json();
      if (!response.ok)
        throw new Error(json.error ?? "Failed to delete account");

      // Sign out locally — auth state listener will clear the session
      await signOutUser();
      return { success: true };
    } catch (e) {
      console.error("[deleteAccount] error:", e);
      return { success: false, error: (e as Error).message };
    } finally {
      set({ loading: false });
    }
  },
}));
