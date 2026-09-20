import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, User } from "../types";

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: () => boolean;
  role: () => "admin" | "learner";
  setSession: (session: AuthResponse) => void;
  logout: () => void;
}

// Persisted to localStorage: only the token + the user object the server
// already returned - never anything else. Real data (progress, lessons,
// content) always comes from the server.
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      isAuthenticated: () => Boolean(get().token),
      role: () => (get().user?.is_admin ? "admin" : "learner"),

      setSession: ({ token, user }) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: "rav-ai-auth" }
  )
);
