"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { logoutUser } from "@/store/api/authApi";
import { superAdminLogout } from "@/store/api/superAdminAuthApi";
import { ROUTES } from "@/constants";
import { clearAllAuthStorage } from "@/lib/authSession";

const IDLE_TIMEOUT_MS = 60 * 60 * 1000;

export function useIdleLogout() {
  const dispatch = useAppDispatch();
  const isAdminAuthenticated = useAppSelector(
    (state) => state.auth.isAuthenticated
  );
  const isSuperAdminAuthenticated = useAppSelector(
    (state) => state.superAdminAuth.isAuthenticated
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAdminAuthenticated && !isSuperAdminAuthenticated) {
      return;
    }

    const logoutForInactivity = async () => {
      toast.error("Session expired due to inactivity.");
      clearAllAuthStorage();
      await Promise.all([
        dispatch(logoutUser()),
        dispatch(superAdminLogout()),
      ]);

      const loginPath = isSuperAdminAuthenticated
        ? ROUTES.superAdminLogin
        : ROUTES.login;

      if (!window.location.pathname.startsWith(loginPath)) {
        window.location.href = loginPath;
      }
    };

    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        void logoutForInactivity();
      }, IDLE_TIMEOUT_MS);
    };

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "keydown",
      "scroll",
      "click",
      "touchstart",
    ];

    events.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true })
    );
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [dispatch, isAdminAuthenticated, isSuperAdminAuthenticated]);
}
