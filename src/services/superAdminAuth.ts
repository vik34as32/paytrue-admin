import { STORAGE_KEYS } from "@/constants/storage";
import {
  SuperAdminLoginPayload,
  SuperAdminProfile,
} from "@/types/superAdmin";
import { login as superAdminLoginApi } from "@/services/superAdminApi";

export async function superAdminLogin(credentials: SuperAdminLoginPayload) {
  return superAdminLoginApi(credentials);
}

export function superAdminLogout() {
  localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_USER);
  localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_REFRESH_TOKEN);
}

export function getStoredSuperAdminUser(): SuperAdminProfile | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_USER);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as SuperAdminProfile;
  } catch {
    return null;
  }
}

export function getSuperAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN);
}
