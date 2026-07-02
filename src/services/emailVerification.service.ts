import { publicClient } from "@/lib/api/client";
import { ApiResponse } from "@/types";

export interface SendEmailVerificationPayload {
  email: string;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export async function sendEmailVerification(email: string) {
  const { data } = await publicClient.post<ApiResponse<unknown>>(
    "/auth/send-email-verification",
    { email } satisfies SendEmailVerificationPayload
  );
  return data;
}

export async function verifyEmail(email: string, otp: string) {
  const { data } = await publicClient.post<ApiResponse<unknown>>(
    "/auth/verify-email",
    { email, otp } satisfies VerifyEmailPayload
  );
  return data;
}
