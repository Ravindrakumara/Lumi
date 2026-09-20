import { create } from "zustand";

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface ChatState {
  // Deliberately NOT persisted (unlike settingsStore) - conversation
  // history lives only for the current session, same as before this was
  // extracted from ChatWindow's local state. The point of pulling it out
  // here isn't durability, it's letting the Chat screen and the
  // dedicated Voice Mode screen (VoiceModePage.tsx) share one
  // conversation instead of each keeping its own, unrelated copy.
  messages: ChatMessage[];
  quotaExceeded: boolean;
  addMessage: (message: ChatMessage) => void;
  setQuotaExceeded: (value: boolean) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [{ role: "assistant", text: "Hi! Ask me anything, or start a lesson from the sidebar." }],
  quotaExceeded: false,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setQuotaExceeded: (value) => set({ quotaExceeded: value }),
}));
