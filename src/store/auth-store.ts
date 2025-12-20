import { SignInData, SignUpData } from "@/types/auth";
import {
  fetchUserProfile,
  signInWithEmail,
  signOutUser,
} from "@/utils/auth-utils";
import { Session } from "@supabase/supabase-js";
import { deleteItemAsync, getItem, setItem } from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AuthStore = {
  isLoggedIn: boolean;
  session: Session | null;
  profile?: UserProfile | null;
  loading?: boolean;
  signingOut?: boolean;
};

type AuthActions = {
  signIn: (data: SignInData) => void;
  signOut: () => Promise<void>;
  signUpWithEmail: (
    data: SignUpData
  ) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
};

export const useAuthStore = create(
  persist<AuthStore & AuthActions>(
    (set, get) => ({
      isLoggedIn: false,
      session: null,
      profile: null,
      loading: true,
      signingOut: false,
      signIn: async (data: SignInData) => {
        set({ loading: true });
        const { session, profile } = await signInWithEmail(data);
        if (session) {
          set({
            isLoggedIn: true,
            session,
            profile,
            loading: false,
          });
        } else {
          set({ loading: false });
        }
      },
      signOut: async () => {
        set({ signingOut: true });
        await signOutUser();
        set({
          isLoggedIn: false,
          session: null,
          profile: null,
          signingOut: false,
        });
      },
      signUpWithEmail: async (data: SignUpData) => {
        // Implementation of signUpWithEmail
        return { success: false };
      },
      refreshProfile: async () => {
        const profile = await fetchUserProfile(get().session?.user.id!);
        if (profile) {
          set({ profile });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => ({
        getItem,
        setItem,
        removeItem: deleteItemAsync,
      })),
    }
  )
);
