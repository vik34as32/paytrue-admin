import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { STORAGE_KEYS, AuthTokenKey } from "@/constants/storage";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://apis.paytrue.co.in/api/v1";

/** Super Admin module base: https://apis.paytrue.co.in/api/v1/super-admin */
export const SUPER_ADMIN_API_BASE = `${API_BASE_URL}/super-admin`;

export const publicClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

export const superAdminPublicClient = axios.create({
  baseURL: SUPER_ADMIN_API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

function getErrorMessage(error: AxiosError): string {
  const data = error.response?.data as
    | { message?: string; error?: string }
    | undefined;
  return data?.message || data?.error || error.message || "An unexpected error occurred";
}

export function createAuthenticatedClient(
  tokenKey: AuthTokenKey,
  loginPath: string,
  baseURL: string = API_BASE_URL
) {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (typeof window === "undefined") return config;

      const token = localStorage.getItem(tokenKey);
      if (!token) {
        return Promise.reject(new Error("Authentication required"));
      }
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem(tokenKey);
        if (tokenKey === STORAGE_KEYS.SUPER_ADMIN_TOKEN) {
          localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_USER);
          localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_REFRESH_TOKEN);
        } else {
          localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
          localStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
        }
        if (!window.location.pathname.startsWith(loginPath)) {
          window.location.href = loginPath;
        }
      }
      return Promise.reject(new Error(getErrorMessage(error)));
    }
  );

  return client;
}

/** Authenticated client for /api/v1 routes (e.g. auth/register) */
export const superAdminClient = createAuthenticatedClient(
  STORAGE_KEYS.SUPER_ADMIN_TOKEN,
  "/super-admin/login"
);

/** Authenticated client for Super Admin module APIs */
export const superAdminModuleClient = createAuthenticatedClient(
  STORAGE_KEYS.SUPER_ADMIN_TOKEN,
  "/super-admin/login",
  SUPER_ADMIN_API_BASE
);

export const adminClient = createAuthenticatedClient(
  STORAGE_KEYS.ADMIN_TOKEN,
  "/login"
);

/** Admin module base: https://apis.paytrue.co.in/api/v1/admin */
export const ADMIN_API_BASE = `${API_BASE_URL}/admin`;

function getAdminModuleToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
  );
}

function clearAdminModuleSession() {
  localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
  localStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
}

export const adminModuleClient = axios.create({
  baseURL: ADMIN_API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

adminModuleClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAdminModuleToken();
    if (!token) {
      return Promise.reject(new Error("Authentication required"));
    }
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminModuleClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearAdminModuleSession();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(new Error(getErrorMessage(error)));
  }
);
