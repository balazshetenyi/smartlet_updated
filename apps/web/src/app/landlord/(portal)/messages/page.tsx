import { createClient } from "@/lib/supabase/server";
import { MessageSquare } from "lucide-react";
import ConversationList from "./_components/ConversationList";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: conversations } = await supabase
    .from("conversations")
    .select(
      "id, last_message_at, tenant:profiles!tenant_id(first_name, last_name), property:properties!property_id(title, cover_image_url)",
    )
    .eq("landlord_id", user!.id)
    .order("last_message_at", { ascending: false });

  const convIds = (conversations ?? []).map((c) => c.id);

  const unreadCounts: Record<string, number> = {};
  if (convIds.length > 0) {
    const { data: unread } = await supabase
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", convIds)
      .eq("is_read", false)
      .neq("sender_id", user!.id);

    (unread ?? []).forEach((m) => {
      unreadCounts[m.conversation_id] =
        (unreadCounts[m.conversation_id] ?? 0) + 1;
    });
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2C3E50]">Messages</h1>
        <p className="text-gray-500 text-sm mt-1">
          {conversations?.length ?? 0} conversation
          {(conversations?.length ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>

      {!conversations || conversations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
          <MessageSquare size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No messages yet</p>
        </div>
      ) : (
        <ConversationList
          conversations={(conversations ?? []).map((conv: any) => ({
            ...conv,
            unread: unreadCounts[conv.id] ?? 0,
          }))}
        />
      )}
    </div>
  );
}
