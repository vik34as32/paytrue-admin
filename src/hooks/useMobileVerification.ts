"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  resendMobileVerification,
  sendMobileVerification,
  verifyMobile,
} from "@/services/mobileVerification.service";

const OTP_COUNTDOWN_SECONDS = 10 * 60;
const MOBILE_REGEX = /^[6-9]\d{9}$/;

function normalizeMobile(mobile: string) {
  return mobile.trim();
}

export function useMobileVerification(currentMobile: string) {
  const [verifiedMobile, setVerifiedMobile] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const normalizedCurrentMobile = normalizeMobile(currentMobile);

  const isVerified = useMemo(
    () =>
      Boolean(
        verifiedMobile &&
          normalizeMobile(verifiedMobile) === normalizedCurrentMobile &&
          normalizedCurrentMobile
      ),
    [verifiedMobile, normalizedCurrentMobile]
  );

  useEffect(() => {
    if (
      verifiedMobile &&
      normalizeMobile(verifiedMobile) !== normalizedCurrentMobile
    ) {
      setVerifiedMobile(null);
      setModalOpen(false);
      setCountdown(0);
    }
  }, [normalizedCurrentMobile, verifiedMobile]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  const startCountdown = useCallback(() => {
    setCountdown(OTP_COUNTDOWN_SECONDS);
  }, []);

  const sendVerificationCode = useCallback(async () => {
    const mobile = normalizeMobile(currentMobile);
    if (!mobile) {
      toast.error("Please enter a mobile number");
      return false;
    }

    if (!MOBILE_REGEX.test(mobile)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return false;
    }

    setSending(true);
    try {
      await sendMobileVerification(mobile);
      toast.success("Verification code sent to your mobile");
      startCountdown();
      setModalOpen(true);
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send verification code"
      );
      return false;
    } finally {
      setSending(false);
    }
  }, [currentMobile, startCountdown]);

  const resendVerificationCode = useCallback(async () => {
    if (countdown > 0) return false;

    const mobile = normalizeMobile(currentMobile);
    if (!mobile) {
      toast.error("Please enter a mobile number");
      return false;
    }

    if (!MOBILE_REGEX.test(mobile)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return false;
    }

    setSending(true);
    try {
      await resendMobileVerification(mobile);
      toast.success("OTP resent successfully");
      startCountdown();
      setModalOpen(true);
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to resend OTP"
      );
      return false;
    } finally {
      setSending(false);
    }
  }, [countdown, currentMobile, startCountdown]);

  const verifyOtp = useCallback(
    async (otp: string) => {
      const mobile = normalizeMobile(currentMobile);
      if (!mobile) {
        toast.error("Mobile number is required");
        return false;
      }

      if (otp.length !== 6) {
        toast.error("Please enter the 6-digit verification code");
        return false;
      }

      setVerifying(true);
      try {
        await verifyMobile(mobile, otp);
        setVerifiedMobile(mobile);
        setModalOpen(false);
        toast.success("Mobile verified successfully");
        return true;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Invalid verification code"
        );
        return false;
      } finally {
        setVerifying(false);
      }
    },
    [currentMobile]
  );

  const resetVerification = useCallback(() => {
    setVerifiedMobile(null);
    setModalOpen(false);
    setCountdown(0);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  return {
    isVerified,
    modalOpen,
    sending,
    verifying,
    countdown,
    sendVerificationCode,
    resendVerificationCode,
    verifyOtp,
    resetVerification,
    closeModal,
    setModalOpen,
  };
}

export const MOBILE_VERIFICATION_REQUIRED_MESSAGE =
  "Please verify mobile number before continuing.";
