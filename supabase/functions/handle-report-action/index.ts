import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const base64UrlDecode = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const verifyToken = async (token: string, secret: string) => {
  const [payloadB64, signatureB64] = token.split(".");
  if (!payloadB64 || !signatureB64) throw new Error("Invalid token");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    Uint8Array.from(
      atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0),
    ),
    new TextEncoder().encode(payloadB64),
  );

  if (!valid) throw new Error("Invalid signature");
  return JSON.parse(base64UrlDecode(payloadB64));
};

const html = (
  title: string,
  emoji: string,
  body: string,
  color = "#2C3E50",
) => `
  <html>
    <body style="font-family: Arial, sans-serif; padding: 40px; max-width: 500px; margin: 0 auto;">
      <h2 style="color: ${color};">${emoji} ${title}</h2>
      <p style="color: #6B7280;">${body}</p>
    </body>
  </html>
`;

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) throw new Error("Missing token");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const emailLinkSecret = Deno.env.get("EMAIL_LINK_SECRET") ?? "";

    if (!supabaseUrl || !serviceRoleKey || !emailLinkSecret) {
      throw new Error("Missing required environment variables");
    }

    const payload = await verifyToken(token, emailLinkSecret);
    if (Date.now() > payload.exp) throw new Error("This link has expired");

    const { reportId, action } = payload as {
      reportId: string;
      action: "investigating" | "resolved_no_breach" | "resolved_breach";
    };

    if (
      !["investigating", "resolved_no_breach", "resolved_breach"].includes(
        action,
      )
    ) {
      throw new Error("Invalid action");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch report + property
    const { data: report, error: reportError } = await supabaseAdmin
      .from("surveillance_reports")
      .select("id, status, reporter_id, property_id")
      .eq("id", reportId)
      .single();

    if (reportError || !report) throw new Error("Report not found");

    // Idempotency — if already resolved, just show current state
    if (
      report.status === "resolved_breach" ||
      report.status === "resolved_no_breach"
    ) {
      return new Response(
        html(
          "Already resolved",
          "ℹ️",
          `This report was already marked as <strong>${report.status.replace("_", " ")}</strong>.`,
        ),
        { headers: { "Content-Type": "text/html" }, status: 200 },
      );
    }

    const { data: property } = await supabaseAdmin
      .from("properties")
      .select("id, title, landlord_id")
      .eq("id", report.property_id)
      .single();

    // ── Apply the action ───────────────────────────────────────────────────

    await supabaseAdmin
      .from("surveillance_reports")
      .update({
        status: action,
        ...(action !== "investigating" && {
          resolved_at: new Date().toISOString(),
        }),
      })
      .eq("id", reportId);

    if (action === "resolved_breach") {
      await supabaseAdmin
        .from("property_surveillance_declarations")
        .update({
          locked: true,
          locked_at: new Date().toISOString(),
          locked_reason:
            "Confirmed surveillance breach following tenant report and admin review",
        })
        .eq("property_id", report.property_id);
    }

    // ── Notify tenant ──────────────────────────────────────────────────────
    const tenantMessages: Record<string, { title: string; body: string }> = {
      investigating: {
        title: "Your report is being reviewed",
        body: `We have started investigating your report about ${property?.title ?? "the property"}.`,
      },
      resolved_no_breach: {
        title: "Report resolved",
        body: `Your report about ${property?.title ?? "the property"} has been reviewed. No surveillance breach was found.`,
      },
      resolved_breach: {
        title: "Report confirmed",
        body: `Your report about ${property?.title ?? "the property"} has been confirmed. The listing has been suspended.`,
      },
    };

    fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        userId: report.reporter_id,
        ...tenantMessages[action],
        data: { screen: "my-reports" },
      }),
    }).catch((e) => console.error("Tenant push error:", e));

    // ── Notify landlord if breach confirmed ────────────────────────────────
    if (action === "resolved_breach" && property?.landlord_id) {
      fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          userId: property.landlord_id,
          title: "Your listing has been suspended",
          body: `${property.title} has been suspended following a confirmed surveillance investigation. Please contact support.`,
          data: { screen: "my-properties" },
        }),
      }).catch((e) => console.error("Landlord push error:", e));
    }

    // ── Return HTML confirmation page ──────────────────────────────────────
    const confirmations: Record<string, [string, string, string, string]> = {
      investigating: [
        "Marked as investigating",
        "🔍",
        "The report has been marked as under investigation. The tenant has been notified.",
        "#F59E0B",
      ],
      resolved_no_breach: [
        "No breach confirmed",
        "✅",
        "The report has been resolved with no breach found. The tenant has been notified.",
        "#10B981",
      ],
      resolved_breach: [
        "Breach confirmed — listing locked",
        "🔒",
        "The listing has been suspended and the tenant and landlord have been notified.",
        "#EF4444",
      ],
    };

    const [title, emoji, message, color] = confirmations[action];
    return new Response(html(title, emoji, message, color), {
      headers: { "Content-Type": "text/html" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      html("Action failed", "⚠️", (error as Error).message, "#EF4444"),
      { headers: { "Content-Type": "text/html" }, status: 400 },
    );
  }
});
