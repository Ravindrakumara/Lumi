import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { VoiceMode } from "../types";

interface SettingsState {
  voiceName: string;
  voiceMode: VoiceMode;
  darkMode: boolean;
  agentName: string; // "" = Auto Router, see constants/agents.ts
  lessonLevel: string;
  // Which account's choice lessonLevel currently reflects. This store
  // persists to localStorage, which is scoped to the BROWSER, not the
  // account - without this, one user's chosen level leaked into whichever
  // account logged in next on the same browser/machine (see
  // syncLessonLevelOwner, called from LessonsPage/SettingsPage on profile
  // load - resets lessonLevel to that account's own recommended Program
  // whenever the owner doesn't match the logged-in user).
  lessonLevelOwnerId: string | null;

  setVoiceName: (voiceName: string) => void;
  setVoiceMode: (voiceMode: VoiceMode) => void;
  setDarkMode: (darkMode: boolean) => void;
  setAgentName: (agentName: string) => void;
  setLessonLevel: (lessonLevel: string, ownerId?: string) => void;
  syncLessonLevelOwner: (ownerId: string, recommendedLevel: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      voiceName: "guy",
      voiceMode: "auto",
      darkMode: false,
      agentName: "",
      lessonLevel: "",
      lessonLevelOwnerId: null,

      setVoiceName: (voiceName) => set({ voiceName }),
      setVoiceMode: (voiceMode) => set({ voiceMode }),
      setDarkMode: (darkMode) => set({ darkMode }),
      setAgentName: (agentName) => set({ agentName }),
      setLessonLevel: (lessonLevel, ownerId) =>
        set((state) => ({ lessonLevel, lessonLevelOwnerId: ownerId ?? state.lessonLevelOwnerId })),
      syncLessonLevelOwner: (ownerId, recommendedLevel) =>
        set((state) =>
          state.lessonLevelOwnerId === ownerId ? {} : { lessonLevel: recommendedLevel, lessonLevelOwnerId: ownerId }
        ),
    }),
    { name: "rav-ai-settings" }
  )
);
