import {serve} from "https://deno.land/std@0.168.0/http/server.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    // 1. Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", {headers: corsHeaders});
    }

    try {
        // 2. Initialize Clients
        const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeSecret) throw new Error("STRIPE_SECRET_KEY is not configured");

        const stripe = new Stripe(stripeSecret, {
            apiVersion: "2023-10-16",
            httpClient: Stripe.createFetchHttpClient(),
        });

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: {
                    headers: {Authorization: req.headers.get("Authorization")!},
                },
            }
        );

        // 3. Parse and validate input
        const body = await req.json();
        const {bookingId} = body;

        if (!bookingId) throw new Error("bookingId is required");

        // 4. Fetch data using proper relational syntax
        const {data: booking, error: bookingError} = await supabaseClient
            .from("bookings")
            .select(`
        total_price,
        property_id,
        properties!inner (landlord_id)
      `)
            .eq("id", bookingId)
            .single();

        if (bookingError || !booking) {
            console.error("Booking fetch error:", bookingError);
            throw new Error("Booking not found");
        }

        // Safely extract landlord_id from the join result
        const propertyData = Array.isArray(booking.properties)
            ? booking.properties[0]
            : booking.properties;

        const landlordId = propertyData?.landlord_id;
        if (!landlordId) throw new Error("Could not identify landlord for this booking");

        // 5. Fetch Landlord's Stripe ID
        const {data: profile, error: profileError} = await supabaseClient
            .from("profiles")
            .select("stripe_account_id")
            .eq("id", landlordId)
            .single();

        if (profileError || !profile?.stripe_account_id) {
            throw new Error("The property owner has not connected a Stripe account yet.");
        }

        // 6. Calculate amounts (Matches 5% UI service fee)
        const totalAmountInPence = Math.round(booking.total_price * 100);
        // Formula to extract the 5% that was added: (Total / 1.05) * 0.05
        const applicationFeeInPence = Math.round((booking.total_price / 1.05) * 0.05 * 100);

        // 7. Create Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmountInPence,
            currency: "gbp",
            automatic_payment_methods: {enabled: true},
            application_fee_amount: applicationFeeInPence,
            transfer_data: {
                destination: profile.stripe_account_id,
            },
            metadata: {
                bookingId: bookingId,
                propertyId: booking.property_id,
            },
        });

        return new Response(
            JSON.stringify({
                clientSecret: paymentIntent.client_secret,
                id: paymentIntent.id,
            }),
            {
                headers: {...corsHeaders, "Content-Type": "application/json"},
                status: 200,
            }
        );
    } catch (error) {
        console.error("Edge Function Error:", error.message);
        return new Response(
            JSON.stringify({error: error.message}),
            {
                headers: {...corsHeaders, "Content-Type": "application/json"},
                status: 400,
            }
        );
    }
});