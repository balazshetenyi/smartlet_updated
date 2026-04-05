import { useAuthStore } from "@/store/auth-store";
import { colours, supabase } from "@kiado/shared";
import "@/styles/global.css";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
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
import { fetchBookingRequests } from "@/utils/booking-utils";
import {
  ActionSheetProvider,
  useActionSheet,
} from "@expo/react-native-action-sheet";
initSentry();

SplashScreen.setOptions({
  duration: 3000,
  fade: true,
});

function PendingBookingsPrompt({
  pendingCount,
  onDismiss,
}: {
  pendingCount: number;
  onDismiss: () => void;
}) {
  const { showActionSheetWithOptions } = useActionSheet();
  const router = useRouter();

  useEffect(() => {
    if (pendingCount === 0) return;

    showActionSheetWithOptions(
      {
        title: "Pending Booking Requests",
        message: `You have ${pendingCount} booking ${pendingCount === 1 ? "request" : "requests"} waiting for your approval.`,
        options: ["Not Now", "View Requests"],
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) router.push("/booking-requests");
        onDismiss();
      },
    );
  }, [pendingCount]);

  return null;
}

function Providers({
  children,
  pendingCount,
  onDismiss,
}: {
  children: React.ReactElement;
  pendingCount: number;
  onDismiss: () => void;
}) {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ActionSheetProvider>
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
                <PendingBookingsPrompt
                  pendingCount={pendingCount}
                  onDismiss={onDismiss}
                />
                {children}
              </StripeProvider>
            </SearchProvider>
          </KeyboardProvider>
        </ToastProvider>
      </ActionSheetProvider>
    </GestureHandlerRootView>
  );
}

function RootLayout() {
  const { isLoggedIn, loading, setSession, loadProfile } = useAuthStore();
  const [pendingCount, setPendingCount] = useState(0);
  useNotifications();

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      setSession(session);

      const shouldLoadProfile =
        event === "INITIAL_SESSION" || event === "SIGNED_IN";

      if (shouldLoadProfile && session?.user?.id) {
        const userId = session.user.id;
        const isFreshSignIn = event === "SIGNED_IN";

        void (async () => {
          try {
            await withTimeout(
              loadProfile(userId),
              10_000,
              "loadProfile timed out",
            );

            // On fresh sign-in only, redirect landlords with pending requests
            if (isFreshSignIn && mounted) {
              const profile = useAuthStore.getState().profile;
              if (profile?.user_role === "landlord") {
                const requests = await fetchBookingRequests(profile.id);
                const pending = requests.filter((r) => r.status === "pending");
                if (pending.length > 0 && mounted) {
                  setPendingCount(pending.length);
                }
              }
            }
          } catch (e) {
            console.error("[Auth] loadProfile failed.");
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
      <Providers
        pendingCount={pendingCount}
        onDismiss={() => setPendingCount(0)}
      >
        <SafeAreaView className="flex-1 bg-white" />
      </Providers>
    );
  }

  return (
    <Providers pendingCount={pendingCount} onDismiss={() => setPendingCount(0)}>
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
