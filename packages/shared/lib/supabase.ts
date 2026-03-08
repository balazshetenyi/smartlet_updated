import "react-native-url-polyfill/auto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

function createStorageAdapter() {
  // Native iOS/Android — must be checked first before any window/global checks
  if (Platform.OS === "ios" || Platform.OS === "android") {
    const AsyncStorage =
      require("@react-native-async-storage/async-storage").default;
    return {
      getItem: (key: string) => AsyncStorage.getItem(key),
      setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
      removeItem: (key: string) => AsyncStorage.removeItem(key),
    };
  }

  // Web browser
  if (Platform.OS === "web") {
    return {
      getItem: (key: string) => globalThis.localStorage.getItem(key),
      setItem: (key: string, value: string) =>
        globalThis.localStorage.setItem(key, value),
      removeItem: (key: string) => globalThis.localStorage.removeItem(key),
    };
  }

  // SSR / Node fallback
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
