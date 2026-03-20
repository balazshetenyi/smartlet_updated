import "@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // Support both direct SDK invocation (payload.email) and Webhooks (payload.record.email)
    const email = payload.record?.email || payload.email;

    if (!email) {
      throw new Error("Missing email in request payload");
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not set in environment variables");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
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

    if (!res.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
