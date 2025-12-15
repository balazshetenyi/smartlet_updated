import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";

/**
 *
 * @description Sends a push notification to the specified Expo push token
 * @param expoPushToken String - The Expo push token of the user
 * @param title String - The title of the notification
 * @param body String - The body of the notification
 */
export async function sendPushNotification(
  expoPushToken: string,
  title?: string,
  body?: string
): Promise<void> {
  const message = {
    to: expoPushToken,
    sound: "default",
    title: title ?? "Original Title",
    body: body ?? "And here is the body!",
    data: { someData: "goes here" },
  };

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error("Failed to send push notification");
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
    Alert.alert("Error", "Failed to send push notification.");
  }
}

/**
 *
 * @description Saves the user's push token to Supabase
 * @param token String - The user's push token
 * @returns Promise<void>
 */
export const savePushToken = async (token: string) => {
  if (!token) return;

  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (userId) {
    const { error } = await supabase
      .from("profiles")
      .update({ push_token: token })
      .eq("id", userId);

    if (error) {
      console.error("Failed to save push token:", error);
    }
  }
};
