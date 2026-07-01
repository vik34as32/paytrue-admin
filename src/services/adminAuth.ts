import { publicClient } from "@/lib/api/client";
import { STORAGE_KEYS } from "@/constants/storage";
import { AdminLoginPayload } from "@/types/superAdmin";
import { ApiResponse, AuthUser } from "@/types";

interface AdminLoginResponseData {
  accessToken: string;
  refreshToken?: string;
  user?: AuthUser & {
    firstName?: string;
    lastName?: string;
    userType?: string;
  };
}

function normalizeAdminUser(
  raw: AdminLoginResponseData["user"]
): AuthUser | null {
  if (!raw) return null;
  return {
    id: raw.id,
    name:
      raw.name ||
      [raw.firstName, raw.lastName].filter(Boolean).join(" ") ||
      raw.email,
    email: raw.email,
    mobile: raw.mobile || "",
    role: raw.role || "admin",
    status: raw.status || "active",
    balance: raw.balance ?? 0,
    avatar: raw.avatar,
  };
}

export async function adminLogin(
  credentials: AdminLoginPayload,
  rememberMe = true
) {
  const { data } = await publicClient.post<ApiResponse<AdminLoginResponseData>>(
    "/auth/login",
    credentials
  );

  const payload = data.data;
  const token = payload.accessToken;
  const user = normalizeAdminUser(payload.user);

  if (!user) {
    throw new Error("Invalid login response");
  }

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(user));
  if (payload.refreshToken) {
    storage.setItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN, payload.refreshToken);
  }

  return { accessToken: token, user };
}

export function adminLogout() {
  localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
  localStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
}

export function getStoredAdminUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_USER);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    return null;
  }
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
  );
}
