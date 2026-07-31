import { publicClient } from "@/lib/api/client";
import { STORAGE_KEYS } from "@/constants/storage";
import { AdminLoginPayload } from "@/types/superAdmin";
import { ApiResponse, AuthUser } from "@/types";
import { resolveAuthRole } from "@/lib/normalizeAuthRole";
import { markAdminLoginSuccess } from "@/lib/authSession";
import {
  clearAuthTokenCookie,
  setAuthTokenCookie,
  setSuperAdminTokenCookie,
} from "@/lib/authCookie";
import { clearLoginToken } from "@/lib/loginToken";
import { ApiClientError } from "@/lib/api/errors";

interface AdminLoginUserPayload {
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUser & {
    firstName?: string;
    lastName?: string;
    userType?: string;
  };
  requiresOtp?: boolean;
  loginToken?: string;
}

interface FlatLoginResponse {
  success?: boolean;
  message?: string;
  requiresOtp?: boolean;
  loginToken?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: AdminLoginUserPayload["user"];
  data?: AdminLoginUserPayload;
}

export type AdminLoginResult =
  | {
      type: "otp_required";
      loginToken: string;
      message: string;
    }
  | {
      type: "authenticated";
      accessToken: string;
      refreshToken?: string;
      user: AuthUser;
    };

function normalizeAdminUser(
  raw: AdminLoginUserPayload["user"]
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
    role: resolveAuthRole(raw),
    status: raw.status || "active",
    balance: raw.balance ?? 0,
    avatar: raw.avatar,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function parseLoginResponse(body: FlatLoginResponse): AdminLoginResult {
  const nested = body.data;
  const requiresOtp = Boolean(body.requiresOtp ?? nested?.requiresOtp);
  const loginToken =
    body.loginToken || nested?.loginToken || undefined;

  if (requiresOtp && loginToken) {
    return {
      type: "otp_required",
      loginToken,
      message: body.message || "OTP sent successfully.",
    };
  }

  const accessToken = body.accessToken || nested?.accessToken;
  const refreshToken = body.refreshToken || nested?.refreshToken;
  const user = normalizeAdminUser(body.user || nested?.user);

  if (accessToken && user) {
    return {
      type: "authenticated",
      accessToken,
      refreshToken,
      user,
    };
  }

  // SUPER_ADMIN bypass may return tokens without a full user object
  if (accessToken && !requiresOtp) {
    const fallbackUser: AuthUser = {
      id: "session",
      name: "Super Admin",
      email: "",
      mobile: "",
      role: "super_admin",
      status: "active",
      balance: 0,
    };
    return {
      type: "authenticated",
      accessToken,
      refreshToken,
      user: fallbackUser,
    };
  }

  throw new ApiClientError(
    body.message || "Invalid login response",
    undefined,
    body
  );
}

export function persistAuthenticatedSession(
  result: Extract<AdminLoginResult, { type: "authenticated" }>,
  rememberMe = true
) {
  const { accessToken, refreshToken, user } = result;
  clearLoginToken();

  if (user.role === "super_admin") {
    localStorage.setItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.SUPER_ADMIN_USER, JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.SUPER_ADMIN_REFRESH_TOKEN, refreshToken);
    }
    setSuperAdminTokenCookie(accessToken);
    return { accessToken, user };
  }

  // Backend JWT (`loginToken`) is stored as accessToken + adminToken.
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN, refreshToken);
  }

  if (!rememberMe) {
    sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    sessionStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, accessToken);
    if (refreshToken) {
      sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN, refreshToken);
    }
  }

  setAuthTokenCookie(accessToken, true);
  markAdminLoginSuccess();

  return { accessToken, user };
}

export async function adminLogin(
  credentials: AdminLoginPayload,
  rememberMe = true
): Promise<AdminLoginResult> {
  const body: AdminLoginPayload = {
    password: credentials.password,
  };
  if (credentials.email?.trim()) {
    body.email = credentials.email.trim().toLowerCase();
  }
  if (credentials.mobile?.trim()) {
    body.mobile = credentials.mobile.trim();
  }

  if (!body.email && !body.mobile) {
    throw new ApiClientError("Email or mobile is required");
  }

  const { data } = await publicClient.post<
    ApiResponse<AdminLoginUserPayload> | FlatLoginResponse
  >("/auth/login", body);

  const result = parseLoginResponse(data as FlatLoginResponse);

  if (result.type === "authenticated") {
    persistAuthenticatedSession(result, rememberMe);
  }

  return result;
}

export function adminLogout() {
  clearLoginToken();
  localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
  localStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
  clearAuthTokenCookie();
}

export function getStoredAdminUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_USER);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as AuthUser & { userType?: string };
    return {
      ...parsed,
      role: resolveAuthRole(parsed),
    };
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

/** Used when syncing cookies after hydration from storage. */
export function syncAdminAuthCookieFromStorage() {
  const token = getAdminToken();
  if (!token) {
    clearAuthTokenCookie();
    return;
  }
  const rememberMe = !!localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
  setAuthTokenCookie(token, rememberMe);
}

export function extractRemainingAttempts(error: unknown): number | null {
  if (!(error instanceof ApiClientError) || !error.data) return null;
  const root = asRecord(error.data);
  if (!root) return null;
  const nested = asRecord(root.data);
  const value = root.remainingAttempts ?? nested?.remainingAttempts;
  return typeof value === "number" ? value : null;
}
