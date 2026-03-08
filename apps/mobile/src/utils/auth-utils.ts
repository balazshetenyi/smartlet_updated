import { signInSchema, signUpSchema } from "@/config/schemas";
import { supabase } from "@kiado/shared";
import { SignInResponse } from "@kiado/shared/types/auth";
import { UserProfile } from "@kiado/shared/types/user";
import { Alert } from "react-native";
import zod from "zod";

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

export async function signInWithEmail(
  signInData: zod.infer<typeof signInSchema>,
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
  userId: string,
): Promise<UserProfile | null> => {
  try {
    const { data, error } = await withTimeout(
      Promise.resolve(
        supabase
          .from("profiles")
          .select(
            `
                *,
                user_roles (
                  role
                )
              `,
          )
          .eq("id", userId)
          .single(),
      ),
      10_000,
      "fetchUserProfile timed out",
    );

    if (error) {
      console.error("[fetchUserProfile] error:", error);
      return null;
    }

    const role = data.user_roles?.[0]?.role || "tenant";
    return { ...data, user_role: role };
  } catch (e) {
    console.error("[fetchUserProfile] failed:", e);
    return null;
  }
};

export const signUpWithEmail = async (
  signUpData: zod.infer<typeof signUpSchema>,
): Promise<{ success: boolean; error?: string }> => {
  if (
    !signUpData.email ||
    !signUpData.password ||
    !signUpData.first_name ||
    !signUpData.last_name
  ) {
    return { success: false, error: "All fields are required." };
  }

  try {
    const {
      data: { session },
      error: signUpError,
    } = await supabase.auth.signUp({
      email: signUpData.email,
      password: signUpData.password,
      options: {
        data: {
          first_name: signUpData.first_name,
          last_name: signUpData.last_name,
          user_role: signUpData.user_type,
        },
      },
    });

    if (signUpError) {
      return { success: false, error: signUpError.message };
    }

    if (session?.user?.id) {
      await supabase
        .from("profiles")
        .update({
          user_role: signUpData.user_type,
          first_name: signUpData.first_name,
          last_name: signUpData.last_name,
        })
        .eq("id", session.user.id);
    }

    return { success: true };
  } catch (error) {
    console.error("Sign up error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
};

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

export const formatPostcode = (value: string) => {
  const cleanValue = value.replace(/\s+/g, "").toUpperCase();
  if (cleanValue.length > 3) {
    return cleanValue.slice(0, -3) + " " + cleanValue.slice(-3);
  }
  return cleanValue;
};
