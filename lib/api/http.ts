import axios, { AxiosInstance, AxiosResponse } from "axios";
import { isDemoMode } from "./demo-mode";
import { API_PREFIX } from "@/lib/api/prefix";

const MOCK_API_PREFIX = "/api/mock/api";

function resolveBaseURL(): string {
  if (isDemoMode()) return "";

  const normalize = (raw: string): string => {
    const trimmed = raw.trim().replace(/\/+$/, "");
    if (!trimmed) return "";
    if (trimmed === API_PREFIX) return "";
    if (trimmed.endsWith(API_PREFIX)) {
      return trimmed.slice(0, Math.max(0, trimmed.length - API_PREFIX.length)).replace(/\/+$/, "");
    }
    return trimmed;
  };

  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("osmedeus_api_endpoint");
    if (saved) {
      const normalized = normalize(saved);
      if (normalized.startsWith("/")) return window.location.origin;
      return normalized;
    }
  }
  const envUrl = process.env.BASE_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    const normalized = normalize(envUrl);
    if (typeof window !== "undefined" && normalized.startsWith("/")) return window.location.origin;
    return normalized;
  }
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export const http: AxiosInstance = axios.create({
  baseURL: resolveBaseURL(),
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  if (isDemoMode()) {
    config.baseURL = "";
    if (typeof config.url === "string") {
      if (config.url === API_PREFIX) {
        config.url = MOCK_API_PREFIX;
      } else if (config.url.startsWith(`${API_PREFIX}/`)) {
        config.url = `${MOCK_API_PREFIX}${config.url.slice(API_PREFIX.length)}`;
      }
    }
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("osmedeus_token");
    if (token) {
      config.headers = config.headers || {};
      (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

http.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Request failed";
    if (status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("osmedeus_token");
      localStorage.removeItem("osmedeus_session");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(new Error(`${status || 0}:${message}`));
  }
);

export function getHttpBaseURL(): string {
  return (http.defaults.baseURL as string) || "";
}
