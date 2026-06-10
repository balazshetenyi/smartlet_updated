"use client";

import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
}

interface Props {
  conversationId: string;
  currentUserId: string;
  tenantName: string;
  propertyTitle: string;
  initialMessages: Message[];
}

export default function ConversationThread({
  conversationId,
  currentUserId,
  tenantName,
  propertyTitle,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg],
          );
          if (newMsg.sender_id !== currentUserId) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
              .then(() => {});
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    setText("");

    const { data: msg, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content,
      })
      .select()
      .single();

    if (!error && msg) {
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return "Today";
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const groupedMessages: Array<{ date: string; msgs: Message[] }> = [];
  messages.forEach((msg) => {
    const d = formatDate(msg.created_at);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last?.date === d) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({ date: d, msgs: [msg] });
    }
  });

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

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
        {groupedMessages.map(({ date, msgs }) => (
          <div key={date}>
            <div className="text-center mb-4">
              <span className="text-xs text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
                {date}
              </span>
            </div>
            <div className="space-y-2">
              {msgs.map((msg) => {
                const isOwn = msg.sender_id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                        isOwn
                          ? "bg-[#7C6CFF] text-white rounded-br-sm"
                          : "bg-white text-[#2C3E50] rounded-bl-sm border border-gray-200"
                      }`}
                    >
                      {msg.attachment_url && msg.attachment_type === "image" && (
                        <img
                          src={msg.attachment_url}
                          alt="attachment"
                          className="rounded-lg mb-2 max-w-full"
                        />
                      )}
                      {msg.content && <p className="leading-relaxed">{msg.content}</p>}
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? "text-white/60" : "text-gray-400"
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className="flex-1 resize-none bg-gray-100 rounded-xl px-4 py-3 text-sm text-[#2C3E50] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C6CFF] max-h-32"
            style={{ minHeight: "44px" }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-10 h-10 bg-[#7C6CFF] hover:bg-[#6B5CE7] disabled:bg-gray-300 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
