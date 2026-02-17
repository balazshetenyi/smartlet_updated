import { Stack } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const AuthLayout = () => {
  return (
    <SafeAreaView className="flex-1 bg-white p-4">
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaView>
  );
};

export default AuthLayout;
