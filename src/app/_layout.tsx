import { useAuthStore } from "@/store/auth-store";
import "@/styles/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { SearchProvider } from "@/context/SearchContext";

export default function RootLayout() {
  const { isLoggedIn } = useAuthStore();

  return (
    <SearchProvider>
      <StatusBar style="auto" />
      <SafeAreaView className="flex-1 bg-white">
        <Stack>
          <Stack.Protected guard={isLoggedIn}>
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={!isLoggedIn}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
      </SafeAreaView>
    </SearchProvider>
  );
}
