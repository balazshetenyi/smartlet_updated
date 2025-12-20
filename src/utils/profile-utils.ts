import { supabase } from "@/lib/supabase";
import { colours } from "@/styles/colours";
import { Alert } from "react-native";

export const getRoleColor = (role?: string) => {
  switch (role) {
    case "landlord":
      return colours.primary;
    case "tenant":
      return colours.secondary;
    case "admin":
      return colours.accent;
    default:
      return colours.muted;
  }
};

export const getRoleIcon = (role?: string) => {
  switch (role) {
    case "landlord":
      return "home";
    case "tenant":
      return "person";
    case "admin":
      return "admin-panel-settings";
    default:
      return "person";
  }
};

export const handleProfileSave = async (
  firstName: string,
  lastName: string,
  phone: string,
  profileId: string
) => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
      })
      .eq("id", profileId);

    if (error) throw error;

    Alert.alert("Success", "Profile updated successfully!");
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile");
  }
};
