"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { resetPasswordSchema, ResetPasswordFormData } from "@/validations";
import { forgotPassword, resetPassword } from "@/services/authPassword";
import { resendMobileVerification } from "@/services/mobileVerification.service";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PasswordStrengthMeter } from "@/components/common/PasswordStrengthMeter";
import { ROUTES } from "@/constants";

const MOBILE_REGEX = /^[6-9]\d{9}$/;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);

  const emailFromUrl = searchParams.get("email") || "";
  const mobileFromUrl = searchParams.get("mobile") || "";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailFromUrl,
      mobile: mobileFromUrl,
      otp: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  useEffect(() => {
    if (emailFromUrl) setValue("email", emailFromUrl);
    if (mobileFromUrl) setValue("mobile", mobileFromUrl);
  }, [emailFromUrl, mobileFromUrl, setValue]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    try {
      const result = await resetPassword({
        email: data.email?.trim() || undefined,
        mobile: data.mobile?.trim() || undefined,
        otp: data.otp.trim(),
        password: data.password,
      });
      setSuccess(true);
      toast.success(result.message || "Password reset successfully.");
      setTimeout(() => router.replace(ROUTES.login), 2200);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const email = getValues("email")?.trim() || undefined;
    const mobile = getValues("mobile")?.trim() || undefined;
    if (!email && !mobile) {
      toast.error("Enter email or mobile to resend OTP");
      return;
    }
    setResending(true);
    try {
      // Mobile OTP uses Fast2SMS resend endpoint
      if (mobile && MOBILE_REGEX.test(mobile)) {
        const result = await resendMobileVerification(mobile);
        toast.success(result.message || "OTP resent successfully.");
        return;
      }

      // Email-only recovery still goes through forgot-password
      const result = await forgotPassword({ email, mobile });
      toast.success(result.message || "OTP resent successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to resend OTP."
      );
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Password updated</h3>
          <p className="mt-1 text-sm text-slate-400">
            Redirecting you to the admin login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Email Address"
        variant="dark"
        type="email"
        placeholder="admin@paytrue.com"
        icon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Mobile Number"
        variant="dark"
        type="tel"
        inputMode="numeric"
        maxLength={10}
        placeholder="Optional if email is provided"
        icon={<Smartphone className="h-4 w-4" />}
        error={errors.mobile?.message}
        {...register("mobile")}
      />

      <div>
        <label className="mb-2 block text-sm font-medium text-white">
          6-digit OTP
        </label>
        <Controller
          name="otp"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <input
                {...field}
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter OTP"
                className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 pl-10 pr-4 font-mono text-lg tracking-[0.35em] text-white outline-none placeholder:tracking-normal placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                onChange={(e) =>
                  field.onChange(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
            </div>
          )}
        />
        {errors.otp?.message ? (
          <p className="mt-1 text-xs text-red-500">{errors.otp.message}</p>
        ) : null}
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            disabled={resending}
            onClick={() => void handleResendOtp()}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 disabled:opacity-60"
          >
            {resending ? "Resending..." : "Resend OTP"}
          </button>
        </div>
      </div>

      <div>
        <Input
          label="New Password"
          variant="dark"
          type={showPassword ? "text" : "password"}
          placeholder="Create a strong password"
          icon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          {...register("password")}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="mt-2 flex items-center gap-2 text-xs text-slate-400 hover:text-blue-400"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          {showPassword ? "Hide password" : "Show password"}
        </button>
        <PasswordStrengthMeter password={password} className="mt-3" />
      </div>

      <div>
        <Input
          label="Confirm Password"
          variant="dark"
          type={showConfirm ? "text" : "password"}
          placeholder="Re-enter new password"
          icon={<Lock className="h-4 w-4" />}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <button
          type="button"
          onClick={() => setShowConfirm((v) => !v)}
          className="mt-2 flex items-center gap-2 text-xs text-slate-400 hover:text-blue-400"
        >
          {showConfirm ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          {showConfirm ? "Hide password" : "Show password"}
        </button>
      </div>

      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>
      </motion.div>
    </form>
  );
}
