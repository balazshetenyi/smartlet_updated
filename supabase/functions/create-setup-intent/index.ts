import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import {serve} from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.39.7";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
});

serve(async (req: { json: () => PromiseLike<{ bookingId: any; }> | { bookingId: any; }; }) => {
    try {
        const {bookingId} = await req.json();
        if (!bookingId) throw new Error("bookingId required");

        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // 1. Get Booking + Tenant info
        const {data: booking, error: bookingError} = await supabaseAdmin
            .from("bookings")
            .select("id, tenant_id")
            .eq("id", bookingId)
            .single();

        if (bookingError || !booking) throw new Error("Booking not found");

        const {data: tenant, error: tenantError} = await supabaseAdmin
            .from("profiles")
            .select("id, email, stripe_account_id")
            .eq("id", booking.tenant_id)
            .single();

        if (tenantError || !tenant) throw new Error("Tenant profile not found");

        // 2. Get or create Stripe customer for tenant
        let customerId = tenant.stripe_account_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: tenant.email,
                metadata: {userId: tenant.id}
            });
            customerId = customer.id;

            // Save customer ID to profile
            await supabaseAdmin
                .from("profiles")
                .update({stripe_account_id: customerId})
                .eq("id", tenant.id);
        }

        // 3. Create Setup Intent
        const setupIntent = await stripe.setupIntents.create({
            payment_method_types: ["card"],
            customer_account: customerId,
            metadata: {bookingId: booking.id, userId: tenant.id},
        })

        return new Response(
            JSON.stringify({clientSecret: setupIntent.client_secret}),
            {headers: {"Content-Type": "application/json"}, status: 200}
        );
    } catch (error) {
        console.error("Setup Intent Error:", error);
        return new Response(JSON.stringify({error: error instanceof Error ? error.message : "Unknown error"}), {
            headers: {"Content-Type": "application/json"},
            status: 400,
        });
    }
});
