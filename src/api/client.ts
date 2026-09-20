import axios from "axios";
import { useAuthStore } from "../store/authStore";

// Vite's dev-server proxy (vite.config.ts) forwards /api to FastAPI on
// :8000, so this stays relative in both dev and the production build
// (which is served by FastAPI itself, same origin).
export const client = axios.create({
  baseURL: "/api",
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
