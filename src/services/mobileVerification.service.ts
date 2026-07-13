import { publicClient } from "@/lib/api/client";
import { ApiResponse } from "@/types";

export interface SendOtpPayload {
  mobile: string;
}

export interface VerifyOtpPayload {
  mobile: string;
  otp: string;
}

/** POST /auth/send-otp — Fast2SMS OTP before creating MD / DD / RT */
export async function sendMobileVerification(mobile: string) {
  const { data } = await publicClient.post<ApiResponse<unknown>>(
    "/auth/send-otp",
    { mobile } satisfies SendOtpPayload
  );
  return data;
}

/** POST /auth/verify-otp — verify mobile OTP */
export async function verifyMobile(mobile: string, otp: string) {
  const { data } = await publicClient.post<ApiResponse<unknown>>(
    "/auth/verify-otp",
    { mobile, otp } satisfies VerifyOtpPayload
  );
  return data;
}
