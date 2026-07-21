"use client";

import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

function ResetFallback() {
  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter the OTP and set a new password for your admin account"
    >
      <Suspense fallback={<ResetFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
