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
import { ToastProvider } from "react-native-toast-notifications";
import { useNotifications } from "@/hooks/useNotifications";

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function Providers({ children }: { children: React.ReactElement }) {
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
              <StatusBar style="auto" />
              {children}
            </StripeProvider>
          </SearchProvider>
        </KeyboardProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const insets = useSafeAreaInsets();
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
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
      </SafeAreaView>
    </Providers>
  );
}
