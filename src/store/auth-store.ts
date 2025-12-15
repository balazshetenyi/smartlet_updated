import { SignInData, SignUpData } from "@/types/auth";
import { signInWithEmail } from "@/utils/auth-utils";
import { Session } from "@supabase/supabase-js";
import { deleteItemAsync, getItem, setItem } from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AuthStore = {
  isLoggedIn: boolean;
  session: Session | null;
  profile?: UserProfile | null;
  loading?: boolean;
};

type AuthActions = {
  signIn: (data: SignInData) => void;
  signOut?: () => Promise<void>;
  signUpWithEmail?: (
    data: SignUpData
  ) => Promise<{ success: boolean; error?: string }>;
  refreshProfile?: () => Promise<UserProfile | null> | null;
};

export const useAuthStore = create(
  persist<AuthStore & AuthActions>(
    (set) => ({
      isLoggedIn: false,
      session: null,
      profile: null,
      loading: true,
      signIn: async (data: SignInData) => {
        set({ loading: true });
        const { session } = await signInWithEmail(data);
        if (session) {
          set({ isLoggedIn: true, session });
        }
        set({ loading: false });
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
