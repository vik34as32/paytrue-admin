"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminLogin } from "@/services/adminAuth";
import {
  resendLoginOtp,
  verifyLoginOtp,
} from "@/services/loginOtp.service";
import { AdminLoginPayload } from "@/types/superAdmin";
import {
  setLoginToken,
  clearLoginToken,
  getLoginRememberMe,
} from "@/lib/loginToken";
import { ROUTES } from "@/constants";
import { getDashboardRouteForRole } from "@/lib/dashboardRoute";
import {
  getApiErrorStatus,
  isAccountLockedError,
} from "@/lib/api/errors";
import { toastBackendError, toastBackendSuccess } from "@/lib/toast";
import { useAppDispatch } from "@/hooks/useAppStore";
import { setAuthSession } from "@/store/slices/authSlice";
import { setSuperAdminSession } from "@/store/slices/superAdminAuthSlice";
import type { SuperAdminProfile } from "@/types/superAdmin";
import type { AuthUser } from "@/types";

function toastHttpError(error: unknown, fallback: string) {
  const status = getApiErrorStatus(error);
  if (status === 423) {
    toast.error(
      error instanceof Error
        ? error.message
        : "Your account has been locked for 1 hour due to multiple invalid OTP attempts."
    );
    return;
  }
  toastBackendError(error, fallback);
}

function syncSession(
  dispatch: ReturnType<typeof useAppDispatch>,
  accessToken: string,
  user: AuthUser
) {
  if (user.role === "super_admin") {
    const profile: SuperAdminProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
    };
    dispatch(setSuperAdminSession({ accessToken, user: profile }));
    return;
  }

  dispatch(setAuthSession({ accessToken, user }));
}

export function useAdminLoginMutation() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (
      payload: AdminLoginPayload & { rememberMe?: boolean }
    ) => {
      const { rememberMe = true, ...credentials } = payload;
      const result = await adminLogin(credentials, rememberMe);
      return { result, rememberMe };
    },
    onSuccess: ({ result, rememberMe }) => {
      if (result.type === "otp_required") {
        setLoginToken(result.loginToken, rememberMe);
        toastBackendSuccess(result.message, "OTP sent successfully.");
        router.push(ROUTES.verifyLoginOtp);
        return;
      }

      clearLoginToken();
      syncSession(dispatch, result.accessToken, result.user);
      toast.success("Login Successful");
      router.replace(getDashboardRouteForRole(result.user.role));
    },
    onError: (error) => {
      toastHttpError(error, "Login failed");
    },
  });
}

export function useVerifyLoginOtpMutation() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: verifyLoginOtp,
    onSuccess: (result) => {
      // loginToken from API is already saved as accessToken in localStorage + cookie.
      clearLoginToken();
      syncSession(dispatch, result.accessToken, result.user);
      toast.success("Login Successful");

      // "Login successful" → always go to Admin dashboard for ADMIN users.
      if (result.user.role === "super_admin") {
        router.replace(ROUTES.superAdminDashboard);
        return;
      }

      router.replace(ROUTES.adminDashboard);
    },
  });
}

export function useResendLoginOtpMutation() {
  return useMutation({
    mutationFn: resendLoginOtp,
    onSuccess: (data) => {
      if (data.loginToken) {
        setLoginToken(data.loginToken, getLoginRememberMe());
      }
      toastBackendSuccess(data.message, "OTP resent successfully.");
    },
    onError: (error) => {
      if (isAccountLockedError(error)) return;
      toastHttpError(error, "Failed to resend OTP");
    },
  });
}
