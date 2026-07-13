"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import { OtpInput } from "@/components/common/OtpInput";

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

interface MobileVerificationModalProps {
  isOpen: boolean;
  mobile: string;
  countdown: number;
  verifying: boolean;
  sending: boolean;
  onClose: () => void;
  onVerify: (otp: string) => Promise<boolean>;
  onResend: () => Promise<boolean>;
}

export function MobileVerificationModal({
  isOpen,
  mobile,
  countdown,
  verifying,
  sending,
  onClose,
  onVerify,
  onResend,
}: MobileVerificationModalProps) {
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setOtp("");
    }
  }, [isOpen]);

  const handleVerify = async () => {
    const success = await onVerify(otp);
    if (success) {
      setOtp("");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mobile Verification"
      subtitle={`Enter the 6-digit code sent to ${mobile || "your mobile"}`}
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={verifying}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleVerify()}
            isLoading={verifying}
            disabled={verifying || otp.length !== 6}
          >
            Verify
          </Button>
        </div>
      }
    >
      <div className="space-y-6 py-2">
        <OtpInput
          value={otp}
          onChange={setOtp}
          disabled={verifying}
          autoFocus
        />

        <div className="flex flex-col items-center gap-2 text-center text-sm">
          {countdown > 0 ? (
            <p className="text-muted">
              Code expires in{" "}
              <span className="font-semibold text-foreground">
                {formatCountdown(countdown)}
              </span>
            </p>
          ) : (
            <p className="text-muted">Verification code expired</p>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void onResend()}
            disabled={countdown > 0 || sending}
            isLoading={sending}
          >
            Resend OTP
          </Button>
        </div>
      </div>
    </Modal>
  );
}
