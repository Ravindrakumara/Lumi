import axios from "axios";
import { useAuthStore } from "../store/authStore";

// Vite's dev-server proxy (vite.config.ts) forwards /api to FastAPI on
// :8000, so this stays relative in dev, and when the build is served by
// FastAPI itself (same origin). On a static host with no backend at the
// same origin (e.g. GitHub Pages), set VITE_API_URL at build time to the
// backend's real URL - see .github/workflows/deploy.yml.
export const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
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
