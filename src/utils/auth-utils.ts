import { signInSchema } from "@/config/schemas";
import { supabase } from "@/lib/supabase";
import { SignInResponse } from "@/types/auth";
import { Alert } from "react-native";
import zod from "zod";

export async function signInWithEmail(
  signInData: zod.infer<typeof signInSchema>
): Promise<SignInResponse> {
  const {
    data: { session },
    error,
  } = await supabase.auth.signInWithPassword(signInData);

  if (error) Alert.alert(error.message);

  if (!session) {
    return { session: null, profile: null };
  }
  const profile = await fetchUserProfile(session.user.id);
  if (!profile) {
    return { session, profile: null };
  }

  return { session, profile };
}

export async function signOutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    Alert.alert("Error", error.message);
    throw error;
  }
}

export const fetchUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
        *,
        user_roles (
          role
        )
      `
    )
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  const role = data.user_roles?.[0]?.role || "tenant";
  return { ...data, user_role: role };
};

// Password strength indicator
export const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
};

export const getPasswordStrengthText = (strength: number) => {
  switch (strength) {
    case 0:
    case 1:
      return { text: "Very Weak", color: "#ff4444" };
    case 2:
      return { text: "Weak", color: "#ff8800" };
    case 3:
      return { text: "Fair", color: "#ffbb00" };
    case 4:
      return { text: "Good", color: "#88cc00" };
    case 5:
      return { text: "Strong", color: "#00aa00" };
    default:
      return { text: "", color: "#000000" };
  }
};

// UK Postcode formatter
export const formatPostcode = (value: string) => {
  // Remove all spaces and convert to uppercase
  const cleanValue = value.replace(/\s+/g, "").toUpperCase();

  // Add space before the last 3 characters if length > 3
  if (cleanValue.length > 3) {
    return cleanValue.slice(0, -3) + " " + cleanValue.slice(-3);
  }
  return cleanValue;
};
