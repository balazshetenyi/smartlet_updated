"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function subscribeToWaitlist(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) return { error: "Email is required" };

  const { error } = await supabase.from("waitlist").insert([{ email }]);

  if (error) {
    if (error.code === "23505")
      return { error: "You are already on the list!" };
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true };
}
