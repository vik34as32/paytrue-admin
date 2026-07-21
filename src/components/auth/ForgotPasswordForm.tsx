"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowRight,
  KeyRound,
  Loader2,
  Mail,
  Smartphone,
} from "lucide-react";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/validations";
import { forgotPassword } from "@/services/authPassword";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetHref, setResetHref] = useState<string>(ROUTES.resetPassword);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "", mobile: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      const email = data.email?.trim() || undefined;
      const mobile = data.mobile?.trim() || undefined;
      const result = await forgotPassword({ email, mobile });

      const params = new URLSearchParams();
      if (email) params.set("email", email);
      if (mobile) params.set("mobile", mobile);
      const qs = params.toString();
      setResetHref(
        qs ? `${ROUTES.resetPassword}?${qs}` : ROUTES.resetPassword
      );
      setSubmitted(true);
      toast.success(
        result.message || "OTP has been sent to your email or mobile."
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to process forgot password request."
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    const identity = getValues("email")?.trim() || getValues("mobile")?.trim();
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
          <KeyRound className="h-6 w-6" />
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-5">
          <p className="text-sm font-medium text-emerald-200">
            If an account exists for <strong>{identity}</strong>, a 6-digit OTP
            has been sent.
          </p>
        </div>
        <p className="text-sm text-slate-400">
          Check your email inbox or SMS, then continue to reset your password.
        </p>
        <Link
          href={resetHref}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:from-blue-500 hover:to-indigo-500"
        >
          Enter OTP &amp; reset password
          <ArrowRight className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="block w-full text-sm text-slate-400 hover:text-blue-300"
        >
          Use a different email / mobile
        </button>
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
      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-700" />
        <span className="text-xs uppercase tracking-wide text-slate-500">
          or
        </span>
        <div className="h-px flex-1 bg-slate-700" />
      </div>
      <Input
        label="Mobile Number"
        variant="dark"
        type="tel"
        inputMode="numeric"
        maxLength={10}
        placeholder="10-digit mobile"
        icon={<Smartphone className="h-4 w-4" />}
        error={errors.mobile?.message}
        {...register("mobile")}
      />
      <p className="text-xs text-slate-500">
        Enter your registered email or mobile. We&apos;ll send a 6-digit OTP.
      </p>

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
              Sending OTP...
            </>
          ) : (
            <>
              Send OTP
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </motion.div>
    </form>
  );
}
