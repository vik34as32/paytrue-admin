"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  sendEmailVerification,
  verifyEmail,
} from "@/services/emailVerification.service";

const OTP_COUNTDOWN_SECONDS = 10 * 60;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function useEmailVerification(currentEmail: string) {
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const normalizedCurrentEmail = normalizeEmail(currentEmail);

  const isVerified = useMemo(
    () =>
      Boolean(
        verifiedEmail &&
          normalizeEmail(verifiedEmail) === normalizedCurrentEmail &&
          normalizedCurrentEmail
      ),
    [verifiedEmail, normalizedCurrentEmail]
  );

  useEffect(() => {
    if (
      verifiedEmail &&
      normalizeEmail(verifiedEmail) !== normalizedCurrentEmail
    ) {
      setVerifiedEmail(null);
      setModalOpen(false);
      setCountdown(0);
    }
  }, [normalizedCurrentEmail, verifiedEmail]);

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
    const email = currentEmail.trim();
    if (!email) {
      toast.error("Please enter an email address");
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    setSending(true);
    try {
      await sendEmailVerification(email);
      toast.success("Verification code sent to your email");
      startCountdown();
      setModalOpen(true);
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send verification code"
      );
      return false;
    } finally {
      setSending(false);
    }
  }, [currentEmail, startCountdown]);

  const resendVerificationCode = useCallback(async () => {
    if (countdown > 0) return false;
    return sendVerificationCode();
  }, [countdown, sendVerificationCode]);

  const verifyOtp = useCallback(
    async (otp: string) => {
      const email = currentEmail.trim();
      if (!email) {
        toast.error("Email is required");
        return false;
      }

      if (otp.length !== 6) {
        toast.error("Please enter the 6-digit verification code");
        return false;
      }

      setVerifying(true);
      try {
        await verifyEmail(email, otp);
        setVerifiedEmail(email);
        setModalOpen(false);
        toast.success("Email verified successfully");
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
    [currentEmail]
  );

  const resetVerification = useCallback(() => {
    setVerifiedEmail(null);
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

export const USER_CREATED_SUCCESS_MESSAGE =
  "User created successfully. Login credentials have been sent to the registered email.";

export const EMAIL_VERIFICATION_REQUIRED_MESSAGE =
  "Please verify email before creating the user.";
