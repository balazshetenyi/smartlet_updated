import { lightTheme as colours, supabase, updateProfile } from "@kiado/shared";
import { Alert } from "react-native";

export const getRoleColor = (role?: string) => {
  switch (role) {
    case "landlord": return colours.primary;
    case "tenant":   return colours.secondary;
    case "admin":    return colours.accent;
    default:         return colours.muted;
  }
};

export const getRoleIcon = (role?: string) => {
  switch (role) {
    case "landlord": return "home";
    case "admin":    return "admin-panel-settings";
    default:         return "person";
  }
};

export const handleProfileSave = async (
  firstName: string,
  lastName: string,
  phone: string,
  profileId: string,
) => {
  const { error } = await updateProfile(supabase, profileId, { firstName, lastName, phone });
  if (error) throw new Error(error);
  Alert.alert("Success", "Profile updated successfully!");
};
