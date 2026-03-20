"use server";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

const WaitlistSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

export async function subscribeToWaitlist(formData: FormData) {
  const emailInput = formData.get("email") as string;

  const validatedFields = WaitlistSchema.safeParse({
    email: emailInput,
  });

  // Return early if the form data is invalid
  if (!validatedFields.success) {
    return {
      error: z.treeifyError(validatedFields.error) || "Invalid email",
    };
  }

  const { email } = validatedFields.data;

  const { error } = await supabase.from("waitlist").insert({ email });

  if (error) {
    if (error.code === "23505")
      return { error: "You are already on the list!" };
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true };
}
