import { adminClient, superAdminClient } from "@/lib/api/client";
import { STORAGE_KEYS } from "@/constants/storage";
import { getApiSuccessMessage } from "@/lib/api/messages";
import { normalizeUserVerification } from "@/lib/idVerification";
import {
  RejectUserPayload,
  UserVerificationInfo,
  VerifyUserPayload,
} from "@/types/idVerification";
import { ApiResponse } from "@/types";

function getVerificationClient() {
  if (typeof window === "undefined") {
    return superAdminClient;
  }

  const adminToken =
    localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
  if (adminToken) {
    return adminClient;
  }

  return superAdminClient;
}

function verificationPath(userId: string, action?: "verify" | "reject") {
  if (action) return `/users/${userId}/${action}`;
  return `/users/${userId}/verification`;
}

/** GET /api/v1/users/:id/verification */
export async function getUserVerification(
  userId: string
): Promise<UserVerificationInfo> {
  const client = getVerificationClient();
  const { data } = await client.get<ApiResponse<unknown> | unknown>(
    verificationPath(userId)
  );
  return normalizeUserVerification(userId, data);
}

/** PATCH /api/v1/users/:id/verify */
export async function verifyUser(
  userId: string,
  payload: VerifyUserPayload
): Promise<{ message: string; verification: UserVerificationInfo }> {
  const client = getVerificationClient();
  const body: Record<string, string> = {};
  const remark = payload.remark?.trim();
  if (remark) body.remark = remark;

  const { data } = await client.patch<ApiResponse<unknown> | unknown>(
    verificationPath(userId, "verify"),
    body
  );

  return {
    message: getApiSuccessMessage(data, "User verified successfully"),
    verification: normalizeUserVerification(userId, data),
  };
}

/** PATCH /api/v1/users/:id/reject */
export async function rejectUser(
  userId: string,
  payload: RejectUserPayload
): Promise<{ message: string; verification: UserVerificationInfo }> {
  const client = getVerificationClient();
  const { data } = await client.patch<ApiResponse<unknown> | unknown>(
    verificationPath(userId, "reject"),
    { reason: payload.reason.trim() }
  );

  return {
    message: getApiSuccessMessage(data, "User rejected successfully"),
    verification: normalizeUserVerification(userId, data),
  };
}
