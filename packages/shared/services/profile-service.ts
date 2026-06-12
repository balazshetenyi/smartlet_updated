import type { SupabaseClient } from "@supabase/supabase-js";
import { normalisePhone } from "../lib/phone-utils";

export type ProfileUpdateData = {
  firstName: string;
  lastName: string;
  phone: string;
};

export async function updateProfile(
  supabase: SupabaseClient,
  profileId: string,
  data: ProfileUpdateData,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone ? (normalisePhone(data.phone) ?? data.phone) : "",
    })
    .eq("id", profileId);

  if (error) return { error: error.message };
  return {};
}
