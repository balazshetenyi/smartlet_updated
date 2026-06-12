"use client";

import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  landlordId: string;
  tenantId: string;
  propertyId: string;
  tenantName: string;
  propertyTitle: string;
}

export default function NewConversationThread({
  landlordId,
  tenantId,
  propertyId,
  tenantName,
  propertyTitle,
}: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    const supabase = createClient();

    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .insert({ landlord_id: landlordId, tenant_id: tenantId, property_id: propertyId })
      .select("id")
      .single();

    if (convError || !conv) {
      setSending(false);
      return;
    }

    await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: landlordId,
      content,
    });

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conv.id);

    router.replace(`/landlord/messages/${conv.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 bg-white">
        <Link
          href="/landlord/messages"
          className="text-gray-400 hover:text-[#2C3E50] transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="w-9 h-9 rounded-full bg-[#7C6CFF]/10 flex items-center justify-center text-[#7C6CFF] font-semibold text-sm">
          {tenantName[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="font-semibold text-[#2C3E50] text-sm">{tenantName}</p>
          <p className="text-xs text-gray-400">{propertyTitle}</p>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Send a message to start the conversation</p>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            autoFocus
            className="flex-1 resize-none bg-gray-100 rounded-xl px-4 py-3 text-sm text-[#2C3E50] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C6CFF] max-h-32"
            style={{ minHeight: "44px" }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-10 h-10 bg-[#7C6CFF] hover:bg-[#6B5CE7] disabled:bg-gray-300 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
