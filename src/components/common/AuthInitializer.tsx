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
          await dispatch(loadAdminSession());
        }
      } finally {
        markAuthHydrationComplete();
      }
    };

    void restoreSession();
  }, [dispatch]);

  return null;
}
