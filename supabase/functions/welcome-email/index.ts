import "@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Webhook received payload:", JSON.stringify(payload));

    // Supabase Webhooks wrap the data in a 'record' object for INSERTs
    const { record } = payload;

    if (!record || !record.email) {
      console.error("Missing email in payload record");
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
      });
    }

    const email = record.email;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Kiado <info@kiado.mozaiksoftwaresolutions.com>",
        to: [email],
        subject: "Welcome to the Waitlist!",
        html: "<strong>Thank you for joining!</strong><p>We will notify you as soon as we launch.</p>",
      }),
    });

    const data = await res.json();
    console.log("Resend response:", JSON.stringify(data));

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
