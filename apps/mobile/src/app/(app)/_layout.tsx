import { HeaderBackButton } from "@/components/shared/HeaderBackButton";
import { useAuthStore } from "@/store/auth-store";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";

export default function AppLayout() {
  const { profile } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect landlords to their dashboard on landing at the tenant home screen.
  // Only fires when on "/" so landlords can still navigate to (account) screens.
  useEffect(() => {
    if (profile?.user_role === "landlord" && pathname === "/") {
      router.replace("/landlord");
    }
  }, [profile?.user_role, pathname]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(account)" options={{ headerShown: false }} />
      <Stack.Screen name="properties" options={{ headerShown: false }} />
      <Stack.Screen name="landlord" options={{ headerShown: false }} />
      <Stack.Screen
        name="book-property/payment"
        options={{
          headerShown: true,
          title: "Payment",
          headerLeft: () => <HeaderBackButton />,
        }}
      />
    </Stack>
  );
}
