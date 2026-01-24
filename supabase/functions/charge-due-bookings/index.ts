import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.39.7";

const createStripePaymentIntent = async (stripeSecret: string, params: Record<string, string>) => {
    const body = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => body.append(key, value));

    const response = await fetch("https://api.stripe.com/v1/payment_intents", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${stripeSecret}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error?.message ?? "Stripe API error");
    }
    return data;
};

const MAX_BATCH = 25;
const MAX_CONCURRENCY = 5;
const TIME_BUDGET_MS = 8_000;

const withTimeoutGuard = (startTime: number) => {
    const elapsed = Date.now() - startTime;
    return elapsed < TIME_BUDGET_MS;
};

Deno.serve(async (req) => {
    // Satisfy pg_net by reading any potential body immediately
    try {
        await req.text();
    } catch { /* ignore */
    }

    console.log("Cron job started: charge-due-bookings");

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

        if (!supabaseUrl || !serviceRoleKey || !stripeSecret) {
            throw new Error("Missing env variables");
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
        const now = new Date().toISOString();

        const {data: bookings, error} = await supabaseAdmin
            .from("bookings")
            .select("id, tenant_id, property_id, total_price, service_fee, payment_method_id")
            .eq("payment_status", "due")
            .lte("payment_due_at", now)
            .not("payment_method_id", "is", null)
            .limit(10); // Smaller batch for stability

        if (error) throw error;

        let charged = 0;
        if (bookings && bookings.length > 0) {
            for (const booking of bookings) {
                try {
                    // Fetch required IDs
                    const {data: tenant} = await supabaseAdmin.from("profiles").select("stripe_customer_id").eq("id", booking.tenant_id).single();
                    const {data: property} = await supabaseAdmin.from("properties").select("landlord_id").eq("id", booking.property_id).single();
                    const {data: landlord} = await supabaseAdmin.from("profiles").select("stripe_account_id").eq("id", property?.landlord_id).single();

                    if (!tenant?.stripe_customer_id || !landlord?.stripe_account_id) {
                        console.log(`Skipping booking ${booking.id}: missing stripe IDs`);
                        continue;
                    }

                    const totalAmount = Math.round(booking.total_price * 100);
                    const feeAmount = Math.round((booking.service_fee || 0) * 100);

                    const paymentIntent = await createStripePaymentIntent(stripeSecret, {
                        amount: String(totalAmount),
                        currency: "gbp",
                        customer: tenant.stripe_customer_id,
                        payment_method: booking.payment_method_id ?? "",
                        off_session: "true",
                        confirm: "true",
                        application_fee_amount: String(feeAmount),
                        "transfer_data[destination]": landlord.stripe_account_id,
                        "metadata[bookingId]": booking.id,
                    });

                    await supabaseAdmin
                        .from("bookings")
                        .update({
                            payment_status: "paid",
                            paid_at: new Date().toISOString(),
                            payment_intent_id: paymentIntent.id,
                        })
                        .eq("id", booking.id);

                    charged++;
                    console.log(`Successfully charged booking: ${booking.id}`);
                } catch (e) {
                    console.error(`Error processing booking ${booking.id}:`, e.message);
                }
            }
        }

        return new Response(JSON.stringify({ok: true, charged}), {
            status: 200,
            headers: {"Content-Type": "application/json"}
        });

    } catch (err) {
        console.error("Function error:", err.message);
        return new Response(JSON.stringify({error: err.message}), {
            status: 500,
            headers: {"Content-Type": "application/json"}
        });
    }
});