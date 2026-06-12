import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewConversationThread from "./_components/NewConversationThread";

export default async function NewConversationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const { tenantId, propertyId, tenantName, propertyTitle } = params;

  if (!tenantId || !propertyId) redirect("/landlord/messages");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If a conversation already exists, go straight to it
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("landlord_id", user!.id)
    .eq("tenant_id", tenantId)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (existing) redirect(`/landlord/messages/${existing.id}`);

  return (
    <NewConversationThread
      landlordId={user!.id}
      tenantId={tenantId}
      propertyId={propertyId}
      tenantName={tenantName ?? "Tenant"}
      propertyTitle={propertyTitle ?? ""}
    />
  );
}
