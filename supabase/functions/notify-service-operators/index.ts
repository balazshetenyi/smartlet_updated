import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

async function sendPush(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
) {
  await supabaseAdmin.functions.invoke("send-push-notification", {
    body: { userId, title, body, data },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { jobId } = await req.json();
    if (!jobId) throw new Error("jobId is required");

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Fetch the job with property location
    const { data: job, error: jobError } = await supabaseAdmin
      .from("service_jobs")
      .select(`
        id,
        service_type,
        title,
        scheduled_date,
        property_id,
        properties!inner (
          id,
          title,
          city,
          location
        )
      `)
      .eq("id", jobId)
      .eq("status", "open")
      .single();

    if (jobError || !job) {
      throw new Error("Job not found or not open");
    }

    const property = Array.isArray(job.properties)
      ? job.properties[0]
      : job.properties;

    // Find operators who offer this service type
    const { data: operators, error: opError } = await supabaseAdmin
      .from("service_operator_profiles")
      .select("id, services, area_lat, area_lng, area_radius_km")
      .eq("is_available", true)
      .contains("services", [job.service_type]);

    if (opError) throw opError;
    if (!operators || operators.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, notified: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Filter operators within their stated radius using PostGIS via RPC if available,
    // otherwise do a rough bounding-box client-side filter.
    // PostGIS is enabled; use ST_DWithin via a raw RPC for accuracy.
    let matchedOperatorIds: string[] = [];

    if (property.location) {
      const { data: nearby, error: geoError } = await supabaseAdmin.rpc(
        "find_service_operators_near_job",
        { p_job_id: jobId, p_service_type: job.service_type },
      );
      if (!geoError && nearby) {
        matchedOperatorIds = (nearby as { id: string }[]).map((r) => r.id);
      }
    }

    // Fallback: notify all available operators for this service type
    // if the geo RPC isn't deployed yet or location is missing.
    if (matchedOperatorIds.length === 0) {
      matchedOperatorIds = operators.map((o) => o.id);
    }

    // Insert DB notifications + push for each matched operator
    const notificationRows = matchedOperatorIds.map((operatorId) => ({
      user_id: operatorId,
      title: `New ${job.service_type} job`,
      message: `${job.title} in ${property.city ?? "your area"}`,
      type: "service_job_posted",
      related_id: job.id,
    }));

    if (notificationRows.length > 0) {
      await supabaseAdmin.from("notifications").insert(notificationRows);
    }

    // Send push notifications (best-effort, don't fail on individual errors)
    await Promise.allSettled(
      matchedOperatorIds.map((operatorId) =>
        sendPush(
          supabaseAdmin,
          operatorId,
          `New ${job.service_type} job nearby`,
          `${job.title}${property.city ? ` · ${property.city}` : ""}`,
          {
            screen: "service-jobs",
            jobId: job.id,
            prefKey: "new_service_job",
          },
        )
      ),
    );

    return new Response(
      JSON.stringify({ ok: true, notified: matchedOperatorIds.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("notify-service-operators error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
