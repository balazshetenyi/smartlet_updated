import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// 6% platform fee on service jobs
const PLATFORM_FEE_RATE = 0.06;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) throw new Error("STRIPE_SECRET_KEY is not configured");

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Use caller's auth token for RLS — landlord must own the job
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );

    // Service role for cross-user writes (notifications, conversation creation)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { applicationId } = await req.json();
    if (!applicationId) throw new Error("applicationId is required");

    // Fetch the application + job + property in one go
    const { data: application, error: appError } = await supabaseClient
      .from("service_job_applications")
      .select(`
        id,
        job_id,
        operator_id,
        quote_price,
        service_jobs!inner (
          id,
          landlord_id,
          property_id,
          service_type,
          title,
          status,
          properties!inner (
            title,
            landlord_id
          )
        )
      `)
      .eq("id", applicationId)
      .single();

    if (appError || !application) throw new Error("Application not found");

    const job = Array.isArray(application.service_jobs)
      ? application.service_jobs[0]
      : application.service_jobs;

    if (job.status !== "open") {
      throw new Error("Job is no longer open for applications");
    }

    // Fetch operator's Stripe Connect account
    const { data: operatorProfile, error: opProfileError } = await supabaseAdmin
      .from("service_operator_profiles")
      .select("stripe_account_id")
      .eq("id", application.operator_id)
      .single();

    if (opProfileError || !operatorProfile?.stripe_account_id) {
      throw new Error("Operator has not connected a Stripe account yet.");
    }

    // Create manual-capture PaymentIntent — funds held until job confirmed complete
    const amountInPence = Math.round(application.quote_price * 100);
    const feeInPence = Math.round(amountInPence * PLATFORM_FEE_RATE);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: "gbp",
      capture_method: "manual",
      application_fee_amount: feeInPence,
      transfer_data: { destination: operatorProfile.stripe_account_id },
      metadata: {
        jobId: job.id,
        applicationId: application.id,
        operatorId: application.operator_id,
      },
    });

    // Approve this application, decline all others for the same job
    await supabaseAdmin
      .from("service_job_applications")
      .update({ status: "approved" })
      .eq("id", applicationId);

    await supabaseAdmin
      .from("service_job_applications")
      .update({ status: "declined" })
      .eq("job_id", job.id)
      .neq("id", applicationId);

    // Update the job to assigned state
    await supabaseAdmin
      .from("service_jobs")
      .update({
        status: "assigned",
        assigned_operator_id: application.operator_id,
        final_price: application.quote_price,
        payment_intent_id: paymentIntent.id,
        payment_status: "held",
        platform_fee: (feeInPence / 100),
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    // Create a conversation between landlord and service operator
    const property = Array.isArray(job.properties) ? job.properties[0] : job.properties;
    const { data: conversation } = await supabaseAdmin
      .from("conversations")
      .insert({
        property_id: job.property_id,
        landlord_id: job.landlord_id,
        service_operator_id: application.operator_id,
        service_job_id: job.id,
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    // Notify the approved operator via DB + push
    await supabaseAdmin.from("notifications").insert({
      user_id: application.operator_id,
      title: "Application approved!",
      message: `Your application for "${job.title}" has been approved. Payment is held — get in touch with the landlord.`,
      type: "service_application_approved",
      related_id: job.id,
    });

    await supabaseAdmin.functions.invoke("send-push-notification", {
      body: {
        userId: application.operator_id,
        title: "Application approved!",
        body: `Your quote for "${job.title}" was accepted`,
        data: {
          screen: "service-my-jobs",
          jobId: job.id,
          conversationId: conversation?.id,
          prefKey: "application_update",
        },
      },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        paymentIntentClientSecret: paymentIntent.client_secret,
        conversationId: conversation?.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("approve-service-application error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
