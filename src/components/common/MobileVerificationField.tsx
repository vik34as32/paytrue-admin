"use client";

import { Phone, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { MobileVerificationModal } from "@/components/common/MobileVerificationModal";
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
      <div className={className ?? "space-y-2"}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label={label}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder={placeholder}
              icon={<Phone className="h-4 w-4" />}
              error={error}
              value={mobile}
              disabled={isVerified}
              onChange={(event) =>
                onMobileChange(event.target.value.replace(/\D/g, "").slice(0, 10))
              }
            />
          </div>
          <Button
            type="button"
            variant={isVerified ? "outline" : "primary"}
            onClick={() => void sendVerificationCode()}
            isLoading={sending}
            disabled={isVerified || sending || mobile.trim().length !== 10}
            className="sm:mb-0.5 sm:shrink-0"
          >
            {isVerified ? "Verified" : "Verify"}
          </Button>
        </div>

        {isVerified && (
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-green/10 px-3 py-1.5 text-xs font-semibold text-accent-green">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mobile Verified
          </div>
        )}
      </div>

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
