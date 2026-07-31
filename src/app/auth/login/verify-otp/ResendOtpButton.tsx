"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ResendOtpButtonProps {
  onResend: () => Promise<unknown> | void;
  disabled?: boolean;
  cooldownSeconds?: number;
  className?: string;
}

export function ResendOtpButton({
  onResend,
  disabled = false,
  cooldownSeconds = 60,
  className,
}: ResendOtpButtonProps) {
  const [secondsLeft, setSecondsLeft] = useState(cooldownSeconds);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const handleResend = async () => {
    if (secondsLeft > 0 || disabled || isResending) return;
    setIsResending(true);
    try {
      await onResend();
      setSecondsLeft(cooldownSeconds);
    } finally {
      setIsResending(false);
    }
  };

  const isCoolingDown = secondsLeft > 0;

  return (
    <div className={className}>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        disabled={disabled || isCoolingDown || isResending}
        onClick={handleResend}
        className="w-full border border-slate-600 bg-slate-800/80 text-slate-100 hover:bg-slate-700"
      >
        {isResending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Resending...
          </>
        ) : isCoolingDown ? (
          <>Resend available in {secondsLeft}</>
        ) : (
          "Resend OTP"
        )}
      </Button>
    </div>
  );
}
