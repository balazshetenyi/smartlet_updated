import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {serve} from "https://deno.land/std@0.168.0/http/server.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

const HOUR = 60 * 60 * 1000;

serve(async (req: Request) => {
    try {
        const {bookingId} = await req.json();
        if (!bookingId) throw new Error("bookingId is required");

        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

        if (!supabaseUrl || !serviceRoleKey || !stripeSecret) {
            throw new Error("Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or STRIPE_SECRET_KEY");
        }

        const stripe = new Stripe(stripeSecret, {
            apiVersion: "2023-10-16",
            httpClient: Stripe.createFetchHttpClient(),
        });

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        const {data: booking, error} = await supabaseAdmin
            .from("bookings")
            .select("id, check_in, base_price, payment_intent_id, status")
            .eq("id", bookingId)
            .single();

        if (error || !booking) throw new Error("Booking not found");
        if (!booking.payment_intent_id) throw new Error("No payment to refund");

        const checkIn = new Date(booking.check_in);
        const now = new Date();
        const hoursToCheckIn = (checkIn.getTime() - now.getTime()) / HOUR;

        const basePrice = booking.base_price ?? 0;
        const refundPercentage = hoursToCheckIn >= 48 ? 1 : 0.5;
        const refundAmount = Math.round(basePrice * refundPercentage * 100);

        if (refundAmount <= 0) throw new Error("Refund amount is zero");

        await stripe.refunds.create({
            payment_intent: booking.payment_intent_id,
            amount: refundAmount,
            refund_application_fee: false,
            reverse_transfer: true,
        });

        await supabaseAdmin
            .from("bookings")
            .update({
                status: "cancelled",
                refunded_at: now.toISOString(),
                refund_amount: refundAmount / 100,
            })
            .eq("id", booking.id);

        return new Response(JSON.stringify({ok: true, refundAmount: refundAmount / 100}), {
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