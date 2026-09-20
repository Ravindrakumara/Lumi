import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { authApi } from "../api/authApi";
import { useAuthStore } from "../store/authStore";
import type { AuthResponse, LoginResult } from "../types";

export type AuthApiError = AxiosError<{ detail: string }>;

export function useAuth() {
  const { token, user, logout } = useAuthStore();

  // Returns LoginResult, not always a real session - a caller (e.g.
  // AdminLoginPage) must check `"totp_required" in result` before
  // assuming login is complete. Only stores a session when it's real.
  const loginMutation = useMutation<LoginResult, AuthApiError, { email: string; password: string }>({
    mutationFn: ({ email, password }) => authApi.login(email, password),
    onSuccess: (data) => {
      if ("token" in data) useAuthStore.getState().setSession(data);
    },
  });

  const verifyTotpMutation = useMutation<AuthResponse, AuthApiError, { totpPendingToken: string; code: string }>({
    mutationFn: ({ totpPendingToken, code }) => authApi.verifyTotp(totpPendingToken, code),
    onSuccess: (data) => useAuthStore.getState().setSession(data),
  });

  const registerMutation = useMutation<
    AuthResponse,
    AuthApiError,
    { email: string; name: string; password: string }
  >({
    mutationFn: ({ email, name, password }) => authApi.register(email, name, password),
    onSuccess: (data) => useAuthStore.getState().setSession(data),
  });

  return {
    token,
    user,
    isAuthenticated: Boolean(token),
    isAdmin: Boolean(user?.is_admin),
    login: loginMutation.mutateAsync,
    loginPending: loginMutation.isPending,
    loginError: loginMutation.error,
    verifyTotp: verifyTotpMutation.mutateAsync,
    verifyTotpPending: verifyTotpMutation.isPending,
    verifyTotpError: verifyTotpMutation.error,
    register: registerMutation.mutateAsync,
    registerPending: registerMutation.isPending,
    registerError: registerMutation.error,
    logout,
  };
}
