import { create } from "zustand";

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export const GREETING: ChatMessage = {
  role: "assistant",
  text: "Hi! Ask me anything, or start a lesson from the sidebar.",
};

/** A fresh conversation id. Nothing is stored until the first message is
 * sent, so opening a new chat and abandoning it leaves no trace. */
export function newSessionId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
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
  /** Which conversation is open. Sent with every message, so the server
   * stores the turn under the right history. */
  sessionId: string;
  addMessage: (message: ChatMessage) => void;
  setQuotaExceeded: (value: boolean) => void;
  /** Replace the open conversation with one loaded from the server. */
  openSession: (sessionId: string, messages: ChatMessage[]) => void;
  /** Start an empty conversation under a new id. */
  startNewSession: () => string;
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [GREETING],
  quotaExceeded: false,
  sessionId: "default",
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setQuotaExceeded: (value) => set({ quotaExceeded: value }),
  openSession: (sessionId, messages) =>
    // An empty history still shows the greeting, so a conversation never
    // opens as a blank panel with no explanation.
    set({ sessionId, messages: messages.length ? messages : [GREETING] }),
  startNewSession: () => {
    const sessionId = newSessionId();
    set({ sessionId, messages: [GREETING] });
    return sessionId;
  },
}));
