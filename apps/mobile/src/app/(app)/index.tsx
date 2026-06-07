import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

/**
 * Entry-point router. Sends every authenticated user to their tab group:
 *   - landlord  →  /landlord  (unless ?guest=1, then /tenant?guest=1)
 *   - tenant    →  /tenant
 * Waits for the profile to load before redirecting so there is no flash.
 */
export default function AppIndex() {
  const theme = useTheme();
  const { profile } = useAuthStore();
  const router = useRouter();
  const { guest } = useLocalSearchParams<{ guest?: string }>();
  const isGuestMode = guest === "1";

  useEffect(() => {
    if (!profile) return;

    if (profile.user_role === "landlord" && !isGuestMode) {
      router.replace("/landlord");
    } else {
      router.replace(isGuestMode ? "/tenant?guest=1" : "/tenant");
    }
  }, [profile?.user_role, isGuestMode]);

  // Neutral spinner while the profile loads or redirect is in flight
  return (
    <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}
