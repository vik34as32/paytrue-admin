"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Shield } from "lucide-react";
import { loginOtpSchema, LoginOtpFormData } from "@/validations";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants";
import {
  clearLoginToken,
  getLoginToken,
  setLoginToken,
  getLoginRememberMe,
} from "@/lib/loginToken";
import {
  useResendLoginOtpMutation,
  useVerifyLoginOtpMutation,
} from "@/hooks/useLoginAuth";
import {
  extractRemainingAttempts,
} from "@/services/adminAuth";
import {
  isAccountLockedError,
  isOtpExpiredMessage,
} from "@/lib/api/errors";
import { toast } from "sonner";
import { toastBackendError } from "@/lib/toast";
import { OtpInput } from "./OtpInput";
import { ResendOtpButton } from "./ResendOtpButton";

export function VerifyOtpForm() {
  const router = useRouter();
  const [loginToken, setTokenState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null
  );
  const [otpExpired, setOtpExpired] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const verifyMutation = useVerifyLoginOtpMutation();
  const resendMutation = useResendLoginOtpMutation();

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginOtpFormData>({
    resolver: zodResolver(loginOtpSchema),
    defaultValues: { otp: "" },
  });

  const otp = watch("otp");

  useEffect(() => {
    const token = getLoginToken();
    if (!token) {
      router.replace(ROUTES.login);
      return;
    }
    setTokenState(token);
    setIsReady(true);
  }, [router]);

  const onSubmit = async (data: LoginOtpFormData) => {
    if (!loginToken || isLocked) return;
    setInlineError(null);
    setOtpExpired(false);
    setRemainingAttempts(null);

    try {
      await verifyMutation.mutateAsync({
        loginToken,
        otp: data.otp,
      });
    } catch (error) {
      if (isAccountLockedError(error)) {
        const lockedMsg =
          "Your account has been locked for 1 hour because of multiple incorrect OTP attempts.";
        setIsLocked(true);
        clearLoginToken();
        setInlineError(lockedMsg);
        toast.error(
          error instanceof Error ? error.message : lockedMsg
        );
        return;
      }

      const message =
        error instanceof Error ? error.message : "Invalid OTP";

      if (isOtpExpiredMessage(message)) {
        setOtpExpired(true);
        setInlineError("OTP expired. Please resend OTP.");
        toast.error("OTP expired. Please resend OTP.");
        return;
      }

      const attempts = extractRemainingAttempts(error);
      setRemainingAttempts(attempts);
      setInlineError(message || "Invalid OTP");
      toastBackendError(error, message || "Invalid OTP");
    }
  };

  const handleResend = async () => {
    if (!loginToken || isLocked) return;
    setInlineError(null);
    setOtpExpired(false);
    setRemainingAttempts(null);
    setValue("otp", "");

    try {
      const result = await resendMutation.mutateAsync({ loginToken });
      if (result.loginToken) {
        setLoginToken(result.loginToken, getLoginRememberMe());
        setTokenState(result.loginToken);
      }
    } catch (error) {
      if (isAccountLockedError(error)) {
        setIsLocked(true);
        clearLoginToken();
        setInlineError(
          "Your account has been locked for 1 hour because of multiple incorrect OTP attempts."
        );
      }
    }
  };

  const busy =
    verifyMutation.isPending || resendMutation.isPending || !isReady;

  if (!isReady) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 ring-1 ring-blue-400/30">
          <Shield className="h-10 w-10 text-blue-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-white">Verify Login OTP</h2>
        <p className="mt-2 text-sm text-slate-400">
          We have sent OTP to your registered Email and Mobile Number.
        </p>
      </div>

      {isLocked ? (
        <div className="space-y-6">
          <div
            role="alert"
            className="w-full rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-4 text-sm text-rose-200"
          >
            Your account has been locked for 1 hour because of multiple
            incorrect OTP attempts.
          </div>
          <Button
            type="button"
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
            onClick={() => {
              clearLoginToken();
              router.replace(ROUTES.login);
            }}
          >
            Back To Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {(inlineError || otpExpired) && (
            <div
              role="alert"
              className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
            >
              <p className="font-medium">
                {otpExpired ? "OTP expired." : inlineError || "Invalid OTP"}
              </p>
              {otpExpired && (
                <p className="mt-1 text-amber-200/80">Please resend OTP.</p>
              )}
              {!otpExpired && remainingAttempts != null && (
                <p className="mt-1 text-amber-200/80">
                  Remaining Attempts: {remainingAttempts}
                </p>
              )}
            </div>
          )}

          <div>
            <OtpInput
              value={otp}
              disabled={busy}
              onChange={(value) =>
                setValue("otp", value, { shouldValidate: true })
              }
              onComplete={() => {
                void handleSubmit(onSubmit)();
              }}
            />
            {errors.otp?.message && (
              <p className="mt-2 text-center text-xs text-rose-400">
                {errors.otp.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={busy || otp.length !== 6}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
          >
            {verifyMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify OTP"
            )}
          </Button>

          <ResendOtpButton
            onResend={handleResend}
            disabled={busy}
            cooldownSeconds={60}
          />

          <button
            type="button"
            disabled={busy}
            onClick={() => {
              clearLoginToken();
              router.replace(ROUTES.login);
            }}
            className="w-full text-center text-sm font-medium text-slate-400 transition hover:text-blue-300"
          >
            Back to Login
          </button>
        </form>
      )}
    </div>
  );
}
