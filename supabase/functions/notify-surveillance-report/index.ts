import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const base64UrlEncode = (data: Uint8Array) =>
  btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const signToken = async (payload: Record<string, unknown>, secret: string) => {
  const encodedPayload = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encodedPayload),
  );
  return `${encodedPayload}.${base64UrlEncode(new Uint8Array(signature))}`;
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
    const emailLinkSecret = Deno.env.get("EMAIL_LINK_SECRET") ?? "";

    if (!supabaseUrl || !serviceRoleKey || !emailLinkSecret) {
      throw new Error("Missing required environment variables");
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorised");

    const { data: report, error: reportError } = await supabaseAdmin
      .from("surveillance_reports")
      .select("id, description, reporter_id, property_id")
      .eq("id", reportId)
      .eq("reporter_id", user.id)
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

    // ── Sign one token per action (7-day expiry) ───────────────────────────
    const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const [tokenInvestigating, tokenNoBreach, tokenBreach] = await Promise.all([
      signToken({ reportId, action: "investigating", exp }, emailLinkSecret),
      signToken(
        { reportId, action: "resolved_no_breach", exp },
        emailLinkSecret,
      ),
      signToken({ reportId, action: "resolved_breach", exp }, emailLinkSecret),
    ]);

    const actionBase = `${supabaseUrl}/functions/v1/handle-report-action`;
    const urlInvestigating = `${actionBase}?token=${encodeURIComponent(tokenInvestigating)}`;
    const urlNoBreach = `${actionBase}?token=${encodeURIComponent(tokenNoBreach)}`;
    const urlBreach = `${actionBase}?token=${encodeURIComponent(tokenBreach)}`;

    // ── Notify all admins ──────────────────────────────────────────────────
    const { data: admins } = await supabaseAdmin
      .from("profiles")
      .select("id, email, first_name, push_token")
      .eq("is_admin", true);

    if (!admins || admins.length === 0) {
      console.warn("No admin users found — skipping notifications");
    }

    for (const admin of admins ?? []) {
      // Push (non-blocking)
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

      // Email with action buttons
      if (resendApiKey && admin.email) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px;">
            <h2 style="color: #EF4444;">⚠️ New Surveillance Report</h2>
            <p>Hi ${admin.first_name ?? "Admin"},</p>
            <p>A tenant has filed a surveillance report that requires your review.</p>

            <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
              <tr>
                <td style="padding: 8px; font-weight: bold; width: 140px; border: 1px solid #E5E7EB;">Property</td>
                <td style="padding: 8px; border: 1px solid #E5E7EB;">${propertyLabel}</td>
              </tr>
              <tr style="background: #F9FAFB;">
                <td style="padding: 8px; font-weight: bold; border: 1px solid #E5E7EB;">Reported by</td>
                <td style="padding: 8px; border: 1px solid #E5E7EB;">${reporterName} (${reporter?.email ?? "unknown"})</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; border: 1px solid #E5E7EB;">Description</td>
                <td style="padding: 8px; border: 1px solid #E5E7EB;">${descriptionSnippet}</td>
              </tr>
            </table>

            <p style="font-weight: bold; margin-top: 24px;">Take action:</p>
            <table style="border-collapse: collapse;">
              <tr>
                <td style="padding: 6px;">
                  <a href="${urlInvestigating}" style="display: inline-block; background: #F59E0B; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    🔍 Start Investigating
                  </a>
                </td>
                <td style="padding: 6px;">
                  <a href="${urlNoBreach}" style="display: inline-block; background: #10B981; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    ✅ No Breach Found
                  </a>
                </td>
                <td style="padding: 6px;">
                  <a href="${urlBreach}" style="display: inline-block; background: #EF4444; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    🔒 Confirmed Breach — Lock Listing
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size: 12px; color: #6B7280; margin-top: 24px;">
              These links expire in 7 days. Each link can only be used once.
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
            from: "Kiado Safety <no-reply@kiado.mozaiksoftwaresolutions.com>",
            to: [admin.email],
            subject: `⚠️ Surveillance report — ${propertyLabel}`,
            html: emailHtml,
          }),
        }).catch((e) => console.error("Admin email error:", e));
      }
    }

    // ── Notify landlord (push only) ────────────────────────────────────────
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
