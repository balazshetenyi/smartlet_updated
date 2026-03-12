import "@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, input, placeId } = await req.json();
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");

    if (!apiKey) {
      throw new Error("Missing Google API Key");
    }

    let url = "";

    // 1. Handle Autocomplete
    if (action === "autocomplete") {
      if (!input) throw new Error("Input required for autocomplete");
      url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input,
      )}&key=${apiKey}&types=(regions)`;
    }

    // 2. Handle Place Details (Geocoding)
    else if (action === "details") {
      if (!placeId) throw new Error("Place ID required for details");
      url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name&key=${apiKey}`;
    } else {
      throw new Error("Invalid action");
    }

    // Proxy the request to Google
    const googleResponse = await fetch(url);
    const data = await googleResponse.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
