import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {serve} from "https://deno.land/std@0.168.0/http/server.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.39.7";

serve(async (req) => {
    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        const {bookingId} = await req.json();

        if (!bookingId) {
            throw new Error("bookingId is required");
        }

        const {error} = await supabaseAdmin
            .from("bookings")
            .update({
                status: "declined",
                declined_at: new Date().toISOString(),
            })
            .eq("id", bookingId);

        if (error) {
            console.error("Database error:", error);
            throw error;
        }

        return new Response(JSON.stringify({success: true}), {
            headers: {"Content-Type": "application/json"},
            status: 200,
        });
    } catch (error) {
        console.error("Decline booking error:", error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error",
                details: error
            }),
            {
                headers: {"Content-Type": "application/json"},
                status: 400,
            }
        );
    }
});
