import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { bookingId } = await req.json();
    if (!bookingId) throw new Error("bookingId required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""; // For user verification
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey || !stripeSecret) {
      throw new Error("Missing required environment variables");
    }

    // 2. Initialize Clients
    // Use the Service Role key for admin actions (DB updates)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    // Use the user's own token for verification
    const authHeader = req.headers.get("Authorization")!;
    const supabaseUserClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2023-10-16",
    });

    // 3. Verify the User is logged in
    const {
      data: { user },
      error: authError,
    } = await supabaseUserClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // 4. Get Booking + Tenant info (using admin client to ensure we can read it)
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("id, tenant_id")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) throw new Error("Booking not found");

    // 5. Security Check: Ensure the logged-in user is the tenant of this booking
    if (booking.tenant_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Not your booking" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        },
      );
    }

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, stripe_customer_id")
      .eq("id", booking.tenant_id)
      .single();

    if (tenantError || !tenant) throw new Error("Tenant profile not found");

    // 6. Get or create Stripe customer for tenant
    let customerId = tenant.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: tenant.email,
        metadata: { userId: tenant.id },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", tenant.id);
    }

    // 7. Create Setup Intent
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ["card"],
      customer: customerId,
      metadata: { bookingId: booking.id, userId: tenant.id },
    });

    return new Response(
      JSON.stringify({ clientSecret: setupIntent.client_secret }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Setup Intent Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
