"use client";

import { Phone } from "lucide-react";
import { MobileVerificationModal } from "@/components/common/MobileVerificationModal";
import { VerificationInput } from "@/components/common/VerificationInput";
import { useMobileVerification } from "@/hooks/useMobileVerification";

export type MobileVerificationState = ReturnType<typeof useMobileVerification>;

interface MobileVerificationFieldProps {
  mobile: string;
  onMobileChange: (value: string) => void;
  verification: MobileVerificationState;
  error?: string;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function MobileVerificationField({
  mobile,
  onMobileChange,
  verification,
  error,
  placeholder = "10-digit mobile",
  label = "Mobile",
  className,
}: MobileVerificationFieldProps) {
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
        type="tel"
        inputMode="numeric"
        maxLength={10}
        placeholder={placeholder}
        icon={<Phone className="h-4 w-4" />}
        error={error}
        value={mobile}
        onValueChange={(value) =>
          onMobileChange(value.replace(/\D/g, "").slice(0, 10))
        }
        isVerified={isVerified}
        sending={sending}
        canVerify={mobile.trim().length === 10}
        onVerify={() => void sendVerificationCode()}
        autoComplete="tel"
      />

      <MobileVerificationModal
        isOpen={modalOpen}
        mobile={mobile}
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
