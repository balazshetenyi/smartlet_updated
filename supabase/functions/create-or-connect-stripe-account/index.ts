import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body =
      req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const { stripeAccountId: providedAccountId } = body;

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) throw new Error("STRIPE_SECRET_KEY is not configured");

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    // Pass the token explicitly to getUser()
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) throw new Error("Unauthorized");

    // Get current profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("stripe_account_id, email, first_name, last_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) throw new Error("Profile not found");

    let accountId = providedAccountId || profile.stripe_account_id;

    // 1. If an account ID was provided but not in DB, verify it with Stripe
    if (providedAccountId && !profile.stripe_account_id) {
      try {
        const existingAccount =
          await stripe.accounts.retrieve(providedAccountId);
        accountId = existingAccount.id;

        // Update profile with the verified ID
        await supabaseClient
          .from("profiles")
          .update({ stripe_account_id: accountId })
          .eq("id", user.id);
      } catch (e) {
        throw new Error(
          "Invalid Stripe Account ID. Please check and try again.",
        );
      }
    }

    // 2. Create new account if none exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: profile.email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        metadata: {
          supabase_user_id: user.id,
        },
      });
      accountId = account.id;

      // Update profile with new Stripe account ID
      await supabaseClient
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", user.id);
    }

    // 3. Create account link for onboarding
    // Note: Replace 'your-app-scheme://' with your actual Expo scheme or web URL
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `https://kiado.app/payout-setup?refresh=true`,
      return_url: `https://kiado.app/payout-setup?success=true`,
      type: "account_onboarding",
    });

    return new Response(
      JSON.stringify({ url: accountLink.url, success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Stripe/Internal Error:", error.message);

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
