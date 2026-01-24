import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import {serve} from "https://deno.land/std@0.168.0/http/server.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.39.7";

const HOUR = 60 * 60 * 1000;

serve(async () => {
    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
        const appUrl = Deno.env.get("APP_URL") ?? "https://example.com";

        if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
            throw new Error("Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or RESEND_API_KEY");
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        const now = new Date();
        const dueBy = new Date(now.getTime() + 48 * HOUR);

        const {data: bookings, error} = await supabaseAdmin
            .from("bookings")
            .select("id, tenant_id, property_id, payment_due_at, total_price")
            .eq("payment_status", "due")
            .is("reminder_sent_at", null)
            .lte("payment_due_at", dueBy.toISOString());

        if (error) throw error;
        if (!bookings?.length) {
            return new Response(JSON.stringify({ok: true, sent: 0}), {
                headers: {"Content-Type": "application/json"},
                status: 200,
            });
        }

        let sent = 0;

        for (const booking of bookings) {
            const {data: tenant} = await supabaseAdmin
                .from("profiles")
                .select("id, email, first_name")
                .eq("id", booking.tenant_id)
                .single();

            const {data: property} = await supabaseAdmin
                .from("properties")
                .select("id, title")
                .eq("id", booking.property_id)
                .single();

            if (!tenant?.email) continue;

            const dueAt = new Date(booking.payment_due_at ?? "");
            const payUrl = `${appUrl}/bookings/${booking.id}/payment`;

            const subject = `Payment reminder for ${property?.title ?? "your booking"}`;
            const text = `
Hi ${tenant.first_name ?? "there"},

Your payment is due on ${dueAt.toDateString()}.

Amount: £${booking.total_price}
Pay now: ${payUrl}

Thanks,
SmartLet
      `.trim();

            const emailResponse = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${resendApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: "SmartLet <no-reply@your-domain.com>",
                    to: [tenant.email],
                    subject,
                    text,
                }),
            });

            if (emailResponse.ok) {
                await supabaseAdmin
                    .from("bookings")
                    .update({reminder_sent_at: now.toISOString()})
                    .eq("id", booking.id);

                sent += 1;
            }
        }

        return new Response(JSON.stringify({ok: true, sent}), {
            headers: {"Content-Type": "application/json"},
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({error: (error as Error).message}), {
            headers: {"Content-Type": "application/json"},
            status: 400,
        });
    }
});