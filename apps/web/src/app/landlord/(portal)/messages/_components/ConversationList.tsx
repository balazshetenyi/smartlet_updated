"use client";

import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Conversation {
  id: string;
  last_message_at: string | null;
  tenant: { first_name: string; last_name: string } | null;
  property: { title: string; cover_image_url: string | null } | null;
  unread: number;
}

const formatTime = (d: string | null) => {
  if (!d) return "";
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export default function ConversationList({ conversations: initial }: { conversations: Conversation[] }) {
  const router = useRouter();
  const [conversations, setConversations] = useState(initial);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(id);
    const supabase = createClient();
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setDeleting(null);
    router.refresh();
  };

  if (conversations.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
      {conversations.map((conv) => (
        <div key={conv.id} className="group relative flex items-center hover:bg-gray-50 transition-colors">
          <Link
            href={`/landlord/messages/${conv.id}`}
            className="flex items-center gap-4 px-5 py-4 flex-1 min-w-0"
          >
            <div className="w-10 h-10 rounded-full bg-[#7C6CFF]/10 flex items-center justify-center text-[#7C6CFF] font-semibold text-sm shrink-0">
              {conv.tenant?.first_name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#2C3E50] truncate">
                {conv.tenant?.first_name} {conv.tenant?.last_name}
              </p>
              <p className="text-xs text-gray-400 truncate">{conv.property?.title}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <p className="text-xs text-gray-400">{formatTime(conv.last_message_at)}</p>
              {conv.unread > 0 && (
                <span className="w-5 h-5 bg-[#7C6CFF] rounded-full text-white text-xs flex items-center justify-center font-medium">
                  {conv.unread}
                </span>
              )}
            </div>
          </Link>

          <button
            onClick={(e) => handleDelete(e, conv.id)}
            disabled={deleting === conv.id}
            className="opacity-0 group-hover:opacity-100 mr-4 p-1.5 text-gray-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 shrink-0"
            title="Delete conversation"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
