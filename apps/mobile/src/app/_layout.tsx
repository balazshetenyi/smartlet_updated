import { useAuthStore } from "@/store/auth-store";
import { colours, supabase } from "@kiado/shared";
import "@/styles/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { SearchProvider } from "@/context/SearchContext";
import { StripeProvider } from "@/components/shared/StripeProviderWrapper";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { HeaderBackButton } from "@/components/shared/HeaderBackButton";
import { ToastProvider } from "react-native-toast-notifications";
import { useNotifications } from "@/hooks/useNotifications";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme, View } from "react-native";
import * as Sentry from "@sentry/react-native";
import { initSentry } from "@/config/sentry";
import { withTimeout } from "@/utils/generic-utils";
initSentry();

SplashScreen.setOptions({
  duration: 3000,
  fade: true,
});

function Providers({ children }: { children: React.ReactElement }) {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
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
              <StatusBar style={colorScheme === "dark" ? "dark" : "dark"} />
              {children}
            </StripeProvider>
          </SearchProvider>
        </KeyboardProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}

function RootLayout() {
  const { isLoggedIn, loading, setSession, loadProfile } = useAuthStore();
  useNotifications();

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      console.log("[Auth] event:", event);

      setSession(session);

      const shouldLoadProfile =
        event === "INITIAL_SESSION" || event === "SIGNED_IN";

      if (shouldLoadProfile && session?.user?.id) {
        const userId = session.user.id;

        void (async () => {
          try {
            await withTimeout(
              loadProfile(userId),
              10_000,
              "loadProfile timed out",
            );
          } catch (e) {
            console.error("[Auth] loadProfile failed:", e);
            useAuthStore.setState({ profile: null });
          } finally {
            if (mounted) useAuthStore.setState({ loading: false });
          }
        })();

        return;
      }

      if (event === "SIGNED_OUT") {
        useAuthStore.setState({ profile: null, loading: false });
        return;
      }

      useAuthStore.setState({ loading: false });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <Providers>
        <SafeAreaView className="flex-1 bg-white" />
      </Providers>
    );
  }

  return (
    <Providers>
      <View style={{ flex: 1, backgroundColor: colours.cardBackground }}>
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
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
      </View>
    </Providers>
  );
}

export default Sentry.wrap(RootLayout);
