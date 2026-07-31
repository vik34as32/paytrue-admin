"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/hooks/useAppStore";
import { loadStoredUser } from "@/store/api/authApi";
import { loadStoredSuperAdmin } from "@/store/api/superAdminAuthApi";
import { loadAdminSession } from "@/store/api/adminModuleApi";
import {
  markAuthHydrationComplete,
  resetAuthHydrationComplete,
} from "@/lib/authSession";
import { STORAGE_KEYS } from "@/constants/storage";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import {
  setAuthTokenCookie,
  setSuperAdminTokenCookie,
} from "@/lib/authCookie";

export default function AuthInitializer() {
  const dispatch = useAppDispatch();
  useIdleLogout();

  useEffect(() => {
    resetAuthHydrationComplete();

    const restoreSession = async () => {
      try {
        await Promise.all([
          dispatch(loadStoredUser()),
          dispatch(loadStoredSuperAdmin()),
        ]);
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) ||
              sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
            : null;
        if (token) {
          const rememberMe = !!localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
          setAuthTokenCookie(token, rememberMe);
          await dispatch(loadAdminSession());
        }
        const superAdminToken =
          typeof window !== "undefined"
            ? localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN)
            : null;
        if (superAdminToken) {
          setSuperAdminTokenCookie(superAdminToken);
        }
      } finally {
        markAuthHydrationComplete();
      }
    };

    void restoreSession();
  }, [dispatch]);

  return null;
}
