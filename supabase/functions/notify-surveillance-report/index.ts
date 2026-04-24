import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

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
    const { reportId } = await req.json();
    if (!reportId) throw new Error("reportId is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    // Verify the caller is authenticated and owns this report
    const authHeader = req.headers.get("Authorization") ?? "";
    const callerClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      },
    );
    const {
      data: { user },
      error: authError,
    } = await callerClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorised");

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch the report with property and reporter details
    const { data: report, error: reportError } = await supabaseAdmin
      .from("surveillance_reports")
      .select("id, description, reporter_id, property_id")
      .eq("id", reportId)
      .eq("reporter_id", user.id) // ensure caller owns this report
      .single();

    if (reportError || !report)
      throw new Error("Report not found or access denied");

    const { data: property } = await supabaseAdmin
      .from("properties")
      .select("id, title, city, landlord_id")
      .eq("id", report.property_id)
      .single();

    const { data: reporter } = await supabaseAdmin
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", report.reporter_id)
      .single();

    const propertyLabel = [property?.title, property?.city]
      .filter(Boolean)
      .join(", ");

    const reporterName = reporter
      ? `${reporter.first_name} ${reporter.last_name ?? ""}`.trim()
      : "A tenant";

    const descriptionSnippet =
      report.description.length > 120
        ? report.description.slice(0, 120) + "…"
        : report.description;

    // ── Notify all admins ──────────────────────────────────────────────────

    const { data: admins } = await supabaseAdmin
      .from("profiles")
      .select("id, email, first_name, push_token")
      .eq("is_admin", true);

    if (!admins || admins.length === 0) {
      console.warn("No admin users found — skipping notifications");
    }

    for (const admin of admins ?? []) {
      // Push notification (non-blocking, best-effort)
      fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          userId: admin.id,
          title: "⚠️ New surveillance report",
          body: `${reporterName} reported an issue at ${propertyLabel}`,
          data: { screen: "admin-reports" },
        }),
      }).catch((e) => console.error("Admin push error:", e));

      // Email notification
      if (resendApiKey && admin.email) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color: #EF4444;">⚠️ New Surveillance Report</h2>
            <p>Hi ${admin.first_name ?? "Admin"},</p>
            <p>
              A tenant has filed a surveillance report that requires your review.
            </p>
            <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
              <tr>
                <td style="padding: 8px; font-weight: bold; width: 140px;">Property</td>
                <td style="padding: 8px;">${propertyLabel}</td>
              </tr>
              <tr style="background: #F9FAFB;">
                <td style="padding: 8px; font-weight: bold;">Reported by</td>
                <td style="padding: 8px;">${reporterName} (${reporter?.email ?? "unknown"})</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Description</td>
                <td style="padding: 8px;">${descriptionSnippet}</td>
              </tr>
            </table>
            <p style="font-size: 12px; color: #6B7280;">
              Log in to the admin panel to review the full report, view any attached
              photos, and take action.
            </p>
          </div>
        `;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Kiado Safety <info@kiado.mozaiksoftwaresolutions.com>",
            to: [admin.email],
            subject: `⚠️ Surveillance report — ${propertyLabel}`,
            html: emailHtml,
          }),
        }).catch((e) => console.error("Admin email error:", e));
      }
    }

    // ── Notify the landlord (push only, best-effort) ───────────────────────

    if (property?.landlord_id) {
      fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          userId: property.landlord_id,
          title: "A concern has been raised",
          body: `A tenant raised a safety concern about ${property.title}. Our team will be in touch.`,
          data: { screen: "my-properties" },
        }),
      }).catch((e) => console.error("Landlord push error:", e));
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("notify-surveillance-report error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
