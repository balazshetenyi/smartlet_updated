import { HeaderBackButton } from "@/components/shared/HeaderBackButton";
import { useTheme } from "@/hooks/useTheme";
import { Stack } from "expo-router";

export default function AppLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.primary,
        headerTitleStyle: { fontWeight: "700", color: theme.text },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(account)" options={{ headerShown: false }} />
      <Stack.Screen name="properties" options={{ headerShown: false }} />
      <Stack.Screen name="landlord" options={{ headerShown: false }} />
      <Stack.Screen name="tenant" options={{ headerShown: false }} />
      <Stack.Screen name="service" options={{ headerShown: false }} />
      <Stack.Screen name="service-onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="services" options={{ headerShown: false }} />
      <Stack.Screen
        name="book-property/payment"
        options={{
          headerShown: true,
          title: "Payment",
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="book-property/success"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
