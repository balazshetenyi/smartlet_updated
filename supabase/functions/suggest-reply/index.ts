import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

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
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const { messages, myRole, propertyTitle } = (await req.json()) as {
      messages: Array<{ content: string; isOwn: boolean }>;
      myRole: "landlord" | "tenant";
      propertyTitle?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("No messages provided");
    }

    const client = new Anthropic({ apiKey });

    const transcript = messages
      .filter((m) => m.content?.trim())
      .map((m) => `${m.isOwn ? "Me" : "Them"}: ${m.content.trim()}`)
      .join("\n");

    const roleContext =
      myRole === "landlord"
        ? "You are helping a landlord reply to a tenant. Keep replies professional but warm."
        : "You are helping a tenant reply to a landlord. Keep replies polite and clear.";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `${roleContext}${propertyTitle ? `\nProperty: ${propertyTitle}` : ""}

Conversation:
${transcript}

Write exactly 3 short reply options for "Me". Rules:
- Each is 1–2 sentences, natural and conversational
- Vary the angle: e.g. one confirming, one asking a follow-up, one offering detail
- No greetings or sign-offs
- British English

Return ONLY a JSON array of 3 strings, nothing else:
["reply 1", "reply 2", "reply 3"]`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No response generated");
    }

    const raw = textBlock.text.trim();
    const match = raw.match(/\[[\s\S]*\]/);
    const suggestions = JSON.parse(match ? match[0] : raw) as string[];

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error("Invalid suggestions format");
    }

    return new Response(
      JSON.stringify({ suggestions: suggestions.slice(0, 3) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
