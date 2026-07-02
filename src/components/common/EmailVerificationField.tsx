"use client";

import { Mail, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { EmailVerificationModal } from "@/components/common/EmailVerificationModal";
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
      <div className={className ?? "space-y-2 lg:col-span-2"}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label={label}
              type="email"
              placeholder={placeholder}
              icon={<Mail className="h-4 w-4" />}
              error={error}
              value={email}
              disabled={isVerified}
              onChange={(event) => onEmailChange(event.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={sendVerificationCode}
            isLoading={sending}
            disabled={isVerified || sending || !email.trim()}
            className="sm:mb-0.5 sm:shrink-0"
          >
            Send Verification Code
          </Button>
        </div>

        {isVerified && (
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-green/10 px-3 py-1.5 text-xs font-semibold text-accent-green">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Email Verified
          </div>
        )}
      </div>

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
