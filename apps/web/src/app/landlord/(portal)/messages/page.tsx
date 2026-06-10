import { createClient } from "@/lib/supabase/server";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

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

  const formatTime = (d: string | null) => {
    if (!d) return "";
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60_000) return "Just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

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
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {conversations.map((conv: any) => {
            const unread = unreadCounts[conv.id] ?? 0;
            return (
              <Link
                key={conv.id}
                href={`/landlord/messages/${conv.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#7C6CFF]/10 flex items-center justify-center text-[#7C6CFF] font-semibold text-sm flex-shrink-0">
                  {conv.tenant?.first_name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#2C3E50] truncate">
                    {conv.tenant?.first_name} {conv.tenant?.last_name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {conv.property?.title}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-xs text-gray-400">
                    {formatTime(conv.last_message_at)}
                  </p>
                  {unread > 0 && (
                    <span className="w-5 h-5 bg-[#7C6CFF] rounded-full text-white text-xs flex items-center justify-center font-medium">
                      {unread}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
