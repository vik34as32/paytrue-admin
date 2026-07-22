"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { useRoleAccess } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";
import { selectIsAuthRestoring } from "@/store/selectors/authSelectors";
import {
  hasPersistedAdminSession,
  hasPersistedSuperAdminSession,
} from "@/lib/authSession";
import { loadStoredUser } from "@/store/api/authApi";

interface UseAdminGuardOptions {
  /** Allow Super Admin session (shared pages like commission / service master) */
  allowSuperAdmin?: boolean;
}

export function useAdminGuard(options: UseAdminGuardOptions = {}) {
  const { allowSuperAdmin = false } = options;
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAdminApiAuth } = useRoleAccess();
  const { isLoading, isInitialized, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );
  const superAdminAuth = useAppSelector((state) => state.superAdminAuth);
  const isRestoring = useAppSelector(selectIsAuthRestoring);
  const rehydrateAttempted = useRef(false);

  const hasSuperAdminAccess =
    allowSuperAdmin &&
    (superAdminAuth.isAuthenticated || hasPersistedSuperAdminSession());

  useEffect(() => {
    if (isRestoring || isLoading) return;

    if (isAdminApiAuth) {
      rehydrateAttempted.current = false;
      return;
    }

    // Shared Admin + Super Admin pages (commission, service master, etc.)
    if (hasSuperAdminAccess) {
      return;
    }

    if (hasPersistedAdminSession()) {
      if (!isAuthenticated && !rehydrateAttempted.current) {
        rehydrateAttempted.current = true;
        void dispatch(loadStoredUser());
        return;
      }

      if (isInitialized && isAuthenticated && !isAdminApiAuth) {
        router.replace(ROUTES.login);
        return;
      }

      return;
    }

    router.replace(ROUTES.login);
  }, [
    dispatch,
    hasSuperAdminAccess,
    isAdminApiAuth,
    isAuthenticated,
    isInitialized,
    isLoading,
    isRestoring,
    router,
  ]);

  return {
    isAdminApiAuth,
    isRestoring,
    hasSuperAdminAccess,
  };
}
