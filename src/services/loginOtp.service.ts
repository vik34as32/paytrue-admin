import { publicClient } from "@/lib/api/client";
import { ApiResponse, AuthUser } from "@/types";
import { resolveAuthRole } from "@/lib/normalizeAuthRole";
import { ApiClientError } from "@/lib/api/errors";
import {
  AdminLoginResult,
  persistAuthenticatedSession,
} from "@/services/adminAuth";
import { getLoginRememberMe } from "@/lib/loginToken";

export interface VerifyLoginOtpPayload {
  loginToken: string;
  otp: string;
}

export interface ResendLoginOtpPayload {
  loginToken: string;
}

interface VerifyLoginOtpUser {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  mobile?: string;
  role?: string;
  userType?: string;
  status?: AuthUser["status"];
  balance?: number;
  avatar?: string;
  firstName?: string;
  lastName?: string;
}

interface VerifyLoginOtpData {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  access_token?: string;
  refresh_token?: string;
  user?: VerifyLoginOtpUser;
  admin?: VerifyLoginOtpUser;
}

interface FlatVerifyResponse {
  success?: boolean;
  message?: string;
  /** Backend returns the JWT as `loginToken` after OTP verify (not accessToken). */
  loginToken?: string;
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  access_token?: string;
  refresh_token?: string;
  user?: VerifyLoginOtpUser;
  admin?: VerifyLoginOtpUser;
  permissions?: unknown[];
  loginSessionId?: string;
  data?: VerifyLoginOtpData & {
    loginToken?: string;
    tokens?: {
      accessToken?: string;
      refreshToken?: string;
      access_token?: string;
      refresh_token?: string;
      loginToken?: string;
    };
  };
  remainingAttempts?: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(
  sources: Array<Record<string, unknown> | null | undefined>,
  keys: string[]
): string | undefined {
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }
  return undefined;
}

function normalizeStatus(status?: string): AuthUser["status"] {
  const value = (status || "active").toLowerCase();
  if (value === "suspended" || value === "inactive") return value;
  return "active";
}

function normalizeUser(raw?: VerifyLoginOtpUser | null): AuthUser | null {
  if (!raw) return null;
  const id = raw.id || raw._id;
  if (!id && !raw.email) return null;

  return {
    id: id || raw.email || "admin",
    name:
      raw.name ||
      [raw.firstName, raw.lastName].filter(Boolean).join(" ") ||
      raw.email ||
      "Admin",
    email: raw.email || "",
    mobile: raw.mobile || "",
    role: resolveAuthRole(raw),
    status: normalizeStatus(raw.status),
    balance: raw.balance ?? 0,
    avatar: raw.avatar,
  };
}

function parseVerifyResponse(body: FlatVerifyResponse): AdminLoginResult {
  const nested = body.data;
  const tokens = asRecord(nested?.tokens);

  // Backend returns JWT as `loginToken` on successful OTP verify.
  const accessToken = pickString(
    [asRecord(body), asRecord(nested), tokens],
    ["loginToken", "accessToken", "access_token", "token"]
  );
  const refreshToken = pickString(
    [asRecord(body), asRecord(nested), tokens],
    ["refreshToken", "refresh_token"]
  );

  const user =
    normalizeUser(body.user || body.admin || nested?.user || nested?.admin) ||
    ({
      id: "admin",
      name: "Admin",
      email: "",
      mobile: "",
      role: "admin" as const,
      status: "active" as const,
      balance: 0,
    } satisfies AuthUser);

  if (!accessToken) {
    throw new ApiClientError(
      body.message || "Invalid OTP verification response",
      undefined,
      body
    );
  }

  return {
    type: "authenticated",
    accessToken,
    refreshToken,
    user,
  };
}

/** POST /auth/verify-login-otp */
export async function verifyLoginOtp(
  payload: VerifyLoginOtpPayload
): Promise<Extract<AdminLoginResult, { type: "authenticated" }>> {
  const { data } = await publicClient.post<
    ApiResponse<VerifyLoginOtpData> | FlatVerifyResponse
  >("/auth/verify-login-otp", {
    loginToken: payload.loginToken,
    otp: payload.otp,
  });

  const body = data as FlatVerifyResponse;
  const result = parseVerifyResponse(body);
  if (result.type !== "authenticated") {
    throw new ApiClientError("OTP verification failed");
  }

  // Persist JWT as accessToken + adminToken in localStorage/cookie.
  persistAuthenticatedSession(result, getLoginRememberMe());
  return result;
}

/** POST /auth/resend-login-otp */
export async function resendLoginOtp(payload: ResendLoginOtpPayload) {
  const { data } = await publicClient.post<{
    success?: boolean;
    message?: string;
    loginToken?: string;
    data?: { loginToken?: string; message?: string };
  }>("/auth/resend-login-otp", {
    loginToken: payload.loginToken,
  });

  const nextToken = data.loginToken || data.data?.loginToken;
  return {
    message: data.message || data.data?.message || "OTP resent successfully.",
    loginToken: nextToken,
  };
}
