import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import {serve} from "https://deno.land/std@0.168.0/http/server.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.39.7";

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
        {name: "HMAC", hash: "SHA-256"},
        false,
        ["verify"]
    );

    const valid = await crypto.subtle.verify(
        "HMAC",
        key,
        Uint8Array.from(atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)),
        new TextEncoder().encode(payloadB64)
    );

    if (!valid) throw new Error("Invalid signature");
    return JSON.parse(base64UrlDecode(payloadB64));
};

serve(async (req: Request) => {
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
        if (Date.now() > payload.exp) throw new Error("Link expired");

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
        const {data: booking, error: bookingError} = await supabaseAdmin
            .from("bookings")
            .select("id, check_in, status")
            .eq("id", payload.bookingId)
            .single();

        if (bookingError || !booking) throw new Error("Booking not found");
        if (booking.status !== "pending") throw new Error("Booking is no longer pending");

        const paymentDueAt = new Date(new Date(booking.check_in).getTime() - 48 * 60 * 60 * 1000);

        const {error: updateError} = await supabaseAdmin
            .from("bookings")
            .update({
                status: "confirmed",
                payment_status: "due",
                payment_due_at: paymentDueAt.toISOString(),
            })
            .eq("id", booking.id)
            .eq("status", "pending");

        if (updateError) throw updateError;

        const successHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 24px;">
          <h2>✅ Booking confirmed</h2>
          <p>This booking has been confirmed successfully.</p>
        </body>
      </html>
    `;

        return new Response(successHtml, {
            headers: {"Content-Type": "text/html"},
            status: 200,
        });
    } catch (error) {
        const errorHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 24px;">
          <h2>⚠️ Confirmation failed</h2>
          <p>${(error as Error).message}</p>
        </body>
      </html>
    `;
        return new Response(errorHtml, {
            headers: {"Content-Type": "text/html"},
            status: 400,
        });
    }
});