import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ConversationThread from "./_components/ConversationThread";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: conversation } = await supabase
    .from("conversations")
    .select(
      "id, landlord_id, tenant:profiles!tenant_id(id, first_name, last_name), property:properties!property_id(title)",
    )
    .eq("id", id)
    .single();

  if (!conversation || conversation.landlord_id !== user!.id) {
    redirect("/landlord/messages");
  }

  const { data: initialMessages } = await supabase
    .from("messages")
    .select("id, content, sender_id, created_at, attachment_url, attachment_type")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", id)
    .neq("sender_id", user!.id)
    .eq("is_read", false);

  return (
    <ConversationThread
      conversationId={id}
      currentUserId={user!.id}
      tenantName={`${(conversation.tenant as any)?.first_name ?? ""} ${(conversation.tenant as any)?.last_name ?? ""}`.trim()}
      propertyTitle={(conversation.property as any)?.title ?? ""}
      initialMessages={initialMessages ?? []}
    />
  );
}
