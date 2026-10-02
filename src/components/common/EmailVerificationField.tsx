"use client";

import { Mail } from "lucide-react";
import { EmailVerificationModal } from "@/components/common/EmailVerificationModal";
import { VerificationInput } from "@/components/common/VerificationInput";
import { useEmailVerification } from "@/hooks/useEmailVerification";

export type EmailVerificationState = ReturnType<typeof useEmailVerification>;

interface EmailVerificationFieldProps {
  email: string;
  onEmailChange: (value: string) => void;
  verification: EmailVerificationState;
  error?: string;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function EmailVerificationField({
  email,
  onEmailChange,
  verification,
  error,
  placeholder = "Enter email",
  label = "Email",
  className,
}: EmailVerificationFieldProps) {
  const {
    isVerified,
    modalOpen,
    sending,
    verifying,
    countdown,
    sendVerificationCode,
    resendVerificationCode,
    verifyOtp,
    closeModal,
  } = verification;

  return (
    <>
      <VerificationInput
        className={className}
        label={label}
        type="email"
        placeholder={placeholder}
        icon={<Mail className="h-4 w-4" />}
        error={error}
        value={email}
        onValueChange={onEmailChange}
        isVerified={isVerified}
        sending={sending}
        canVerify={Boolean(email.trim())}
        onVerify={() => void sendVerificationCode()}
        autoComplete="email"
      />

      <EmailVerificationModal
        isOpen={modalOpen}
        email={email}
        countdown={countdown}
        verifying={verifying}
        sending={sending}
        onClose={closeModal}
        onVerify={verifyOtp}
        onResend={resendVerificationCode}
      />
    </>
  );
}
