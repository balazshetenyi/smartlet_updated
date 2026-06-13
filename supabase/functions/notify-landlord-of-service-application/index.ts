import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-content, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { applicationId } = await req.json();
    if (!applicationId) throw new Error("applicationId is required");

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Fetch application + job + operator name in one query
    const { data: application, error: appError } = await supabaseAdmin
      .from("service_job_applications")
      .select(`
        id,
        job_id,
        operator_id,
        service_jobs!inner (
          id,
          title,
          landlord_id
        ),
        profiles!inner (
          first_name,
          last_name,
          service_operator_profiles (
            company_name
          )
        )
      `)
      .eq("id", applicationId)
      .single();

    if (appError || !application) throw new Error("Application not found");

    const job = Array.isArray(application.service_jobs)
      ? application.service_jobs[0]
      : application.service_jobs;

    const profile = Array.isArray(application.profiles)
      ? application.profiles[0]
      : application.profiles;

    const operatorProfile = Array.isArray(profile?.service_operator_profiles)
      ? profile?.service_operator_profiles[0]
      : profile?.service_operator_profiles;

    const fullName =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      "An operator";
    const displayName = operatorProfile?.company_name || fullName;

    // Insert in-app notification for the landlord
    await supabaseAdmin.from("notifications").insert({
      user_id: job.landlord_id,
      title: "New service application",
      message: `${displayName} has applied for "${job.title}"`,
      type: "service_application_received",
      related_id: job.id,
    });

    // Send push notification (best-effort)
    await supabaseAdmin.functions.invoke("send-push-notification", {
      body: {
        userId: job.landlord_id,
        title: "New service application",
        body: `${displayName} has applied for "${job.title}"`,
        data: {
          screen: "service-manage",
          jobId: job.id,
          prefKey: "service_application_received",
        },
      },
    });

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("notify-landlord-of-service-application error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
