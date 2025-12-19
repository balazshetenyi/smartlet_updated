import { Message } from "@/types/message";

type MessageStore = {
  unreadCount: number;
  messages: Message[];
  setUnreadCount: (count: number) => void;
  loadMessages: (messages: Message[]) => void;
};

import { create } from "zustand";

export const useMessageStore = create<MessageStore>((set) => ({
  unreadCount: 0,
  messages: [],
  setUnreadCount: (count: number) => set({ unreadCount: count }),
  loadMessages: (messages: Message[]) =>
    set(() => ({
      messages: [...messages],
    })),
}));
