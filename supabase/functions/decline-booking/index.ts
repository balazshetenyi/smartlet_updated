import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { bookingId } = await req.json();

    if (!bookingId) {
      throw new Error("bookingId is required");
    }

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("id, tenant_id, check_in")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) throw new Error("Booking not found");

    const { error } = await supabaseAdmin
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

    // Notify tenant their booking was declined
    fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        userId: booking.tenant_id,
        title: "Booking request declined",
        body: `Your booking request for check-in on ${booking.check_in} was not accepted.`,
        data: {
          screen: "my-bookings",
          prefKey: "booking_cancelled",
        },
      }),
    }).catch((e) => console.error("push notification error:", e));

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Decline booking error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
