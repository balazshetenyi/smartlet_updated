import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import {serve} from "https://deno.land/std@0.168.0/http/server.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const base64UrlEncode = (data: Uint8Array) =>
    btoa(String.fromCharCode(...data))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");

const signToken = async (payload: Record<string, any>, secret: string) => {
    const encodedPayload = base64UrlEncode(
        new TextEncoder().encode(JSON.stringify(payload))
    );

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        {name: "HMAC", hash: "SHA-256"},
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(encodedPayload)
    );

    return `${encodedPayload}.${base64UrlEncode(new Uint8Array(signature))}`;
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {headers: corsHeaders});
    }

    try {
        const {bookingId} = await req.json();
        if (!bookingId) throw new Error("bookingId is required");

        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const emailLinkSecret = Deno.env.get("EMAIL_LINK_SECRET") ?? "";

        if (!supabaseUrl || !serviceRoleKey || !emailLinkSecret) {
            throw new Error("Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or EMAIL_LINK_SECRET");
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        const {data: booking, error: bookingError} = await supabaseAdmin
            .from("bookings")
            .select("id, check_in, check_out, total_price, property_id, tenant_id")
            .eq("id", bookingId)
            .single();

        if (bookingError || !booking) throw new Error("Booking not found");

        const {data: property, error: propertyError} = await supabaseAdmin
            .from("properties")
            .select("id, title, landlord_id")
            .eq("id", booking.property_id)
            .single();

        if (propertyError || !property) throw new Error("Property not found");

        const {data: tenant, error: tenantError} = await supabaseAdmin
            .from("profiles")
            .select("id, first_name, last_name")
            .eq("id", booking.tenant_id)
            .single();

        if (tenantError) throw tenantError;

        const {data: landlord, error: landlordError} = await supabaseAdmin
            .from("profiles")
            .select("id, email, first_name")
            .eq("id", property.landlord_id)
            .single();

        if (landlordError || !landlord?.email) throw new Error("Landlord email missing");

        const tenantName =
            tenant?.first_name
                ? `${tenant.first_name} ${tenant.last_name ?? ""}`.trim()
                : "A tenant";

        // Create a signed, expiring token that the confirm-booking function expects.
        const token = await signToken(
            {
                bookingId: booking.id,
                exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
            },
            emailLinkSecret
        );

        // Link directly to the edge function endpoint
        const confirmUrl = `${supabaseUrl}/functions/v1/confirm-booking?token=${encodeURIComponent(
            token
        )}`;

        const subject = `New booking request for ${property.title}`;

        // Keep the URL on its own line with no leading spaces to help email clients auto-link it.
        const bodyText =
            `Hi ${landlord.first_name ?? "there"},

${tenantName} requested a booking for "${property.title}".

Check-in: ${booking.check_in}
Check-out: ${booking.check_out}
Total: £${booking.total_price}

Confirm this booking:
${confirmUrl}
`;

        const bodyHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <p>Hi ${landlord.first_name ?? "there"},</p>
            <p>
              ${tenantName} requested a booking for "<strong>${property.title}</strong>".
            </p>
            <ul>
              <li><strong>Check-in:</strong> ${booking.check_in}</li>
              <li><strong>Check-out:</strong> ${booking.check_out}</li>
              <li><strong>Total:</strong> £${booking.total_price}</li>
            </ul>
            <p>
              <a href="${confirmUrl}">Confirm this booking</a>
            </p>
            <p style="font-size: 12px; color: #666;">
              If the button doesn’t work, copy and paste this link into your browser:<br/>
              ${confirmUrl}
            </p>
          </div>
        `;

        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

        const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "Kiado App <no-reply@kiado.mozaiksoftwaresolutions.com>",
                to: [landlord.email ?? ""],
                subject,
                text: bodyText,
                html: bodyHtml,
            }),
        });

        if (!emailResponse.ok) {
            throw new Error("Failed to send booking email");
        }

        return new Response(JSON.stringify({ok: true}), {
            headers: {...corsHeaders, "Content-Type": "application/json"},
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({error: (error as Error).message}), {
            headers: {...corsHeaders, "Content-Type": "application/json"},
            status: 400,
        });
    }
});