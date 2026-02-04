import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import "@/styles/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { SearchProvider } from "@/context/SearchContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import { colours } from "@/styles/colours.ts";

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn, loading, setSession, loadProfile } = useAuthStore();

  useEffect(() => {
    // 1) Hydrate initial session (cold start)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2) Keep Zustand in sync with Supabase (sign-in/out/refresh)
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user?.id) await loadProfile(session.user.id);
        else useAuthStore.setState({ profile: null });
      },
    );

    return () => sub.subscription.unsubscribe();
  }, [setSession, loadProfile]);

  // Optional but recommended: don't render routing until we know the auth state
  if (loading) {
    return (
      <SearchProvider>
        <StripeProvider
          publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""}
          merchantIdentifier={process.env.EXPO_PUBLIC_APPLE_MERCHANT_ID || ""}
        >
          <StatusBar style="auto" />
          <SafeAreaView className="flex-1 bg-white" />
        </StripeProvider>
      </SearchProvider>
    );
  }
  return (
    <SearchProvider>
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""}
        merchantIdentifier={process.env.EXPO_PUBLIC_APPLE_MERCHANT_ID || ""}
      >
        <StatusBar style="auto" />
        <SafeAreaView
          edges={["top"]}
          style={{
            flex: 1,
            backgroundColor: colours.background,
            paddingBottom: Math.min(insets.bottom, 0),
          }}
        >
          <Stack>
            <Stack.Protected guard={isLoggedIn}>
              <Stack.Screen name="(app)" options={{ headerShown: false }} />
            </Stack.Protected>
            <Stack.Protected guard={!isLoggedIn}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            </Stack.Protected>
          </Stack>
        </SafeAreaView>
      </StripeProvider>
    </SearchProvider>
  );
}
