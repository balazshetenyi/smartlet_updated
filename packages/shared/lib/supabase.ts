import "react-native-url-polyfill/auto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Build a storage adapter that works on native, web, and SSR (Node)
function createStorageAdapter() {
  // SSR / Node – no window, no AsyncStorage
  if (typeof window === "undefined") {
    const memoryStore = new Map<string, string>();
    return {
      getItem: (key: string) => memoryStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memoryStore.set(key, value);
      },
      removeItem: (key: string) => {
        memoryStore.delete(key);
      },
    };
  }

  // Web browser – use localStorage
  if (Platform.OS === "web") {
    return {
      getItem: (key: string) => globalThis.localStorage.getItem(key),
      setItem: (key: string, value: string) =>
        globalThis.localStorage.setItem(key, value),
      removeItem: (key: string) => globalThis.localStorage.removeItem(key),
    };
  }

  // Native (iOS / Android) – use AsyncStorage
  // Dynamic require so it's never evaluated on web/SSR
  const AsyncStorage =
    require("@react-native-async-storage/async-storage").default;
  return {
    getItem: (key: string) => AsyncStorage.getItem(key),
    setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
    removeItem: (key: string) => AsyncStorage.removeItem(key),
  };
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      storage: createStorageAdapter(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
