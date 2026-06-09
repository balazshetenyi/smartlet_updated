import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RENTAL_TYPE_LABELS: Record<string, { label: string; priceUnit: string }> =
  {
    holiday: { label: "holiday let", priceUnit: "night" },
    short_term: { label: "short-term rental", priceUnit: "week" },
    long_term: { label: "long-term rental", priceUnit: "month" },
  };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const {
      title,
      address,
      city,
      postcode,
      rental_type,
      price,
      bedrooms,
      bathrooms,
      max_guests,
      amenities,
      images, // Array<{ base64: string; mimeType: string }>
    } = await req.json();

    const client = new Anthropic({ apiKey });

    const typeInfo = RENTAL_TYPE_LABELS[rental_type] ?? {
      label: rental_type,
      priceUnit: "period",
    };
    const location = [address, city, postcode].filter(Boolean).join(", ");
    const amenityList =
      Array.isArray(amenities) && amenities.length > 0
        ? amenities.join(", ")
        : "none listed";

    const propertyContext = [
      title ? `Title: ${title}` : null,
      `Type: ${typeInfo.label}`,
      location ? `Location: ${location}` : null,
      price ? `Price: £${price}/${typeInfo.priceUnit}` : null,
      bedrooms != null ? `Bedrooms: ${bedrooms}` : null,
      bathrooms != null ? `Bathrooms: ${bathrooms}` : null,
      max_guests != null ? `Max guests: ${max_guests}` : null,
      `Amenities: ${amenityList}`,
    ]
      .filter(Boolean)
      .join("\n");

    // Accept up to 3 images for vision analysis
    const imageList = Array.isArray(images)
      ? images
          .slice(0, 3)
          .filter((img: { base64?: string; mimeType?: string }) => img.base64)
      : [];

    const content: Anthropic.MessageParam["content"] = [];

    for (const img of imageList) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: (img.mimeType ?? "image/jpeg") as
            | "image/jpeg"
            | "image/png"
            | "image/gif"
            | "image/webp",
          data: img.base64,
        },
      });
    }

    const imageNote =
      imageList.length > 0
        ? `I've attached ${imageList.length} photo(s) of the property. Use what you observe in them — room layout, natural light, finishes, outdoor space, condition — to add specific, vivid detail to the description.`
        : "";

    content.push({
      type: "text",
      text: `You are a professional property copywriter. Write a title and a compelling listing description for the property below.

${propertyContext}
${imageNote ? `\n${imageNote}` : ""}

Return ONLY a JSON object — no markdown, no code blocks, no extra text:
{"title": "...", "description": "..."}

Title rules:
- 5–8 words, specific and evocative
- Highlight the strongest feature (location, space, view, unique quality)
- Not generic ("Beautiful property" is bad; "Bright 3-bed flat near Victoria station" is good)

Description rules:
- 3–4 short paragraphs, 150–200 words total
- Lead with the strongest selling point
- Be specific — no hollow filler phrases like "lovely" or "stunning" unless genuinely earned
- Weave facts naturally into sentences rather than listing them mechanically
- End with who the property suits best (families, couples, remote workers, etc.)
- No heading — body copy only
- British English`,
    });

    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No content generated");
    }

    const raw = textBlock.text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as {
      title: string;
      description: string;
    };

    if (!parsed.title || !parsed.description) {
      throw new Error("Incomplete response from AI");
    }

    return new Response(
      JSON.stringify({
        title: parsed.title.trim(),
        description: parsed.description.trim(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
