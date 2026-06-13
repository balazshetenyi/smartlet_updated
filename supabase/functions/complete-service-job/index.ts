import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";

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
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) throw new Error("STRIPE_SECRET_KEY is not configured");

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Caller must be the landlord — use their auth token for RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { jobId } = await req.json();
    if (!jobId) throw new Error("jobId is required");

    // Fetch the job — RLS ensures caller is the landlord
    const { data: job, error: jobError } = await supabaseClient
      .from("service_jobs")
      .select("id, status, payment_intent_id, payment_status, assigned_operator_id, title")
      .eq("id", jobId)
      .single();

    if (jobError || !job) throw new Error("Job not found");
    if (job.status !== "assigned") throw new Error("Job is not in assigned status");
    if (!job.payment_intent_id) throw new Error("No payment intent on this job");
    if (job.payment_status !== "held") throw new Error("Payment is not in held state");

    // Capture the Stripe PaymentIntent — releases funds to operator minus platform fee
    await stripe.paymentIntents.capture(job.payment_intent_id);

    // Mark job complete
    await supabaseAdmin
      .from("service_jobs")
      .update({
        status: "completed",
        payment_status: "released",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // Notify the operator
    if (job.assigned_operator_id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: job.assigned_operator_id,
        title: "Job completed — payment released",
        message: `Payment for "${job.title}" has been released to your account.`,
        type: "service_job_completed",
        related_id: job.id,
      });

      await supabaseAdmin.functions.invoke("send-push-notification", {
        body: {
          userId: job.assigned_operator_id,
          title: "Payment released!",
          body: `Payment for "${job.title}" is on its way`,
          data: {
            screen: "service-my-jobs",
            jobId: job.id,
            prefKey: "application_update",
          },
        },
      });
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("complete-service-job error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
