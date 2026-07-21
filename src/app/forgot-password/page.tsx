"use client";

import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password"
      subtitle="Recover access to your admin account with a secure OTP"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
