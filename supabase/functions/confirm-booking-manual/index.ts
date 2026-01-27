import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {serve} from "https://deno.land/std@0.168.0/http/server.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.39.7";

serve(async (req: Request) => {
    try {
        const {bookingId} = await req.json();

        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        const {data: booking, error: bookingError} = await supabaseAdmin
            .from("bookings")
            .select("id, check_in, status")
            .eq("id", bookingId)
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

        return new Response(JSON.stringify({success: true}), {
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
