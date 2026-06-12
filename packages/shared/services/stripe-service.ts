import type { SupabaseClient } from "@supabase/supabase-js";

export async function connectStripeAccount(
  supabase: SupabaseClient,
  options?: { stripeAccountId?: string; returnUrl?: string },
): Promise<{ url?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke(
    "create-or-connect-stripe-account",
    {
      body: {
        stripeAccountId: options?.stripeAccountId,
        returnUrl: options?.returnUrl,
      },
    },
  );

  if (error) {
    const ctx = (error as any).context;
    const body =
      ctx instanceof Response ? await ctx.json().catch(() => null) : null;
    return { error: body?.error ?? error.message ?? "Something went wrong" };
  }

  return { url: data?.url };
}
