import type { SupabaseClient } from "@supabase/supabase-js";

export interface GenerateListingInput {
  title?: string;
  address?: string;
  city?: string;
  postcode?: string;
  rental_type?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
  amenities?: string[];
  images?: Array<{ base64: string; mimeType: string }>;
}

export interface GenerateListingResult {
  title: string;
  description: string;
}

export interface SuggestReplyInput {
  messages: Array<{ content: string; isOwn: boolean }>;
  myRole: "landlord" | "tenant";
  propertyTitle?: string;
}

export async function suggestReplies(
  client: SupabaseClient,
  input: SuggestReplyInput,
): Promise<string[]> {
  const { data, error } = await client.functions.invoke("suggest-reply", {
    body: input,
  });
  if (error) throw error;
  if (!Array.isArray(data?.suggestions)) throw new Error("Invalid response");
  return data.suggestions as string[];
}

export async function generateListingContent(
  client: SupabaseClient,
  input: GenerateListingInput,
): Promise<GenerateListingResult> {
  const { data, error } = await client.functions.invoke(
    "generate-listing-description",
    { body: input },
  );
  if (error) throw error;
  if (!data?.title || !data?.description) {
    throw new Error("Incomplete response from AI");
  }
  return { title: data.title as string, description: data.description as string };
}
