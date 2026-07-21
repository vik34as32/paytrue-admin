import { publicClient } from "@/lib/api/client";
import { ApiResponse } from "@/types";

export interface ForgotPasswordPayload {
  email?: string;
  mobile?: string;
}

export interface ResetPasswordPayload {
  email?: string;
  mobile?: string;
  otp: string;
  password: string;
}

function compactIdentifier(payload: {
  email?: string;
  mobile?: string;
}): ForgotPasswordPayload {
  const body: ForgotPasswordPayload = {};
  const email = payload.email?.trim();
  const mobile = payload.mobile?.trim();
  if (email) body.email = email;
  if (mobile) body.mobile = mobile;
  return body;
}

/** POST /api/v1/auth/forgot-password — sends OTP */
export async function forgotPassword(payload: ForgotPasswordPayload) {
  const body = compactIdentifier(payload);
  const { data } = await publicClient.post<ApiResponse<{ message?: string }>>(
    "/auth/forgot-password",
    body
  );
  return data;
}

/** POST /api/v1/auth/reset-password — reset using OTP from forgot-password */
export async function resetPassword(payload: ResetPasswordPayload) {
  const body: ResetPasswordPayload = {
    ...compactIdentifier(payload),
    otp: payload.otp.trim(),
    password: payload.password,
  };
  const { data } = await publicClient.post<ApiResponse<{ message?: string }>>(
    "/auth/reset-password",
    body
  );
  return data;
}
