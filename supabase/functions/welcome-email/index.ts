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
        subject: "You're on the Kiado early access list",
        html: `
          <p>Hi there,</p>
          <p>Thank you for joining the Kiado early access list.</p>
          <p>We’re building a simpler way to manage property — bringing rent, tenants and maintenance together in one clear, affordable platform.</p>
          <p>You’re now among the first to hear when Kiado becomes available. We’ll keep you updated as we move closer to launch.</p>
          <p>No noise. No unnecessary emails. Just meaningful updates.</p>
          <p>If you have any questions in the meantime, simply reply to this email — we read every message.</p>
          <p>Thank you for being early.</p>
          <p>—<br>
          Kiado<br>
          Mozaik Software Solutions</p>
        `,
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
