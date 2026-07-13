import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { STORAGE_KEYS } from "@/constants/storage";
import { handleUnauthorizedRedirect } from "@/lib/authSession";
import { getErrorMessage } from "@/lib/api/messages";
import { API_BASE_URL } from "@/lib/api/client";

function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
  );
}

function getSuperAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN);
}

/**
 * Prefer Admin token, else Super Admin token.
 * Backend allows: permissions.includes('commission.create')
 * OR ['ADMIN','SUPER_ADMIN'].includes(userType)
 */
export function getCommissionAuthToken(): string | null {
  return getAdminToken() || getSuperAdminToken();
}

export function getCommissionAuthMode(): "admin" | "super_admin" | null {
  if (getAdminToken()) return "admin";
  if (getSuperAdminToken()) return "super_admin";
  return null;
}

function attachDualAuth(client: AxiosInstance) {
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getCommissionAuthToken();
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
        const mode = getCommissionAuthMode();
        if (mode === "super_admin") {
          handleUnauthorizedRedirect(
            "/super-admin/login",
            STORAGE_KEYS.SUPER_ADMIN_TOKEN
          );
        } else {
          handleUnauthorizedRedirect("/login", STORAGE_KEYS.ADMIN_TOKEN);
        }
      }
      return Promise.reject(new Error(getErrorMessage(error)));
    }
  );

  return client;
}

/** `/api/v1/commissions` — Admin or Super Admin bearer token */
export const commissionClient = attachDualAuth(
  axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: { "Content-Type": "application/json" },
  })
);

/** `/api/v1/admin/*` — Admin or Super Admin bearer token (services for commission) */
export const commissionAdminModuleClient = attachDualAuth(
  axios.create({
    baseURL: `${API_BASE_URL}/admin`,
    timeout: 30000,
    headers: { "Content-Type": "application/json" },
  })
);
