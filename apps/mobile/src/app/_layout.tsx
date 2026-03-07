import { useAuthStore } from "@/store/auth-store";
import { colours, supabase } from "@kiado/shared";
import "@/styles/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { SearchProvider } from "@/context/SearchContext";
import { StripeProvider } from "@/components/shared/StripeProviderWrapper";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { HeaderBackButton } from "@/components/shared/HeaderBackButton";

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn, loading, setSession, loadProfile } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    // Safety timeout: If Supabase doesn't respond in 3s, show the app anyway
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth initialization timed out - forcing app to load");
        useAuthStore.setState({ loading: false });
      }
    }, 5000);

    // 1) Hydrate initial session (cold start)
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        setSession(session);
        useAuthStore.setState({ loading: false });
        clearTimeout(timeout);
      })
      .catch((err) => {
        console.error("Supabase session error:", err);
        if (mounted) useAuthStore.setState({ loading: false });
        clearTimeout(timeout);
      });

    // 2) Keep Zustand in sync with Supabase (sign-in/out/refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      console.log("Auth State Changed:", _event);
      setSession(session);
      if (session?.user?.id) await loadProfile(session.user.id);
      else useAuthStore.setState({ profile: null });

      // Ensure loading is false after the first event
      useAuthStore.setState({ loading: false });
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // Optional but recommended: don't render routing until we know the auth state
  if (loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <SearchProvider>
            <StripeProvider
              publishableKey={
                process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
              }
              merchantIdentifier={
                process.env.EXPO_PUBLIC_APPLE_MERCHANT_ID || ""
              }
            >
              <StatusBar style="auto" />
              <SafeAreaView className="flex-1 bg-white" />
            </StripeProvider>
          </SearchProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    );
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SearchProvider>
          <StripeProvider
            publishableKey={
              process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
            }
            merchantIdentifier={process.env.EXPO_PUBLIC_APPLE_MERCHANT_ID || ""}
          >
            <StatusBar style="auto" />
            <SafeAreaView
              edges={["top"]}
              style={{
                flex: 1,
                backgroundColor: colours.cardBackground,
                paddingBottom: Math.min(insets.bottom, 0),
              }}
            >
              <Stack
                screenOptions={{
                  headerStyle: {
                    backgroundColor: colours.surface,
                  },
                  headerLeft: () => <HeaderBackButton />,
                  headerTintColor: colours.primary,
                  headerTitleStyle: {
                    fontWeight: "700",
                  },
                }}
              >
                <Stack.Protected guard={isLoggedIn}>
                  <Stack.Screen name="(app)" options={{ headerShown: false }} />
                </Stack.Protected>
                <Stack.Protected guard={!isLoggedIn}>
                  <Stack.Screen
                    name="(auth)"
                    options={{ headerShown: false }}
                  />
                </Stack.Protected>
              </Stack>
            </SafeAreaView>
          </StripeProvider>
        </SearchProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
