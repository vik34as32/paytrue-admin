import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { STORAGE_KEYS } from "@/constants/storage";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://apis.paytrue.co.in/api/v1";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN) ||
    localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) ||
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  );
}

function clearSuperAdminSession() {
  localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_USER);
  localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_REFRESH_TOKEN);
}

function clearAdminSession() {
  localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
  localStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
}

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const hadSuperAdminToken = localStorage.getItem(
        STORAGE_KEYS.SUPER_ADMIN_TOKEN
      );
      if (hadSuperAdminToken) {
        clearSuperAdminSession();
        if (typeof window !== "undefined") {
          window.location.href = "/super-admin/login";
        }
        return Promise.reject(
          new Error("Session expired. Please sign in again.")
        );
      }

      const hadAdminToken =
        localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) ||
        sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
      if (hadAdminToken) {
        clearAdminSession();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(
          new Error("Session expired. Please sign in again.")
        );
      }

      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          }
          return axiosInstance(originalRequest);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    const message =
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;
