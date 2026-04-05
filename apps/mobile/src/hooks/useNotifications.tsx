import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@kiado/shared";
import { useAuthStore } from "@/store/auth-store";
import Constants from "expo-constants";

// How foreground notifications are presented
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("[Notifications] Push notifications only work on real devices");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[Notifications] Permission not granted");
    return null;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      throw new Error("EAS projectId not found in app config");
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
      .data;
    return token;
  } catch (e) {
    console.warn("[Notifications] Failed to get push token.");
    return null;
  }
}

async function savePushToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ push_token: token })
    .eq("id", userId);

  if (error) {
    console.error("[Notifications] Failed to save push token.");
  }
}

async function clearPushToken(userId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ push_token: null })
    .eq("id", userId);

  if (error) {
    console.error("[Notifications] Failed to clear push token.");
  }
}

export function useNotifications() {
  const { session } = useAuthStore();
  const router = useRouter();
  const responseListener = useRef<Notifications.EventSubscription>(null);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    // Register and save token
    registerForPushNotifications().then((token) => {
      if (token) savePushToken(userId, token);
    });

    // User tapped a notification — navigate based on data payload
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<
          string,
          string
        >;

        if (data?.conversationId) {
          router.push(`/messages/${data.conversationId}`);
        } else if (data?.screen === "booking-requests") {
          router.push("/booking-requests");
        } else if (data?.screen === "my-bookings") {
          router.push("/my-bookings");
        }
      });

    return () => {
      responseListener.current?.remove();
    };
  }, [session?.user?.id]);

  return null;
}

export { clearPushToken };
