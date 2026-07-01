"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/hooks/useAppStore";
import { useRoleAccess } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";

export function useAdminGuard() {
  const router = useRouter();
  const { isAdminApiAuth } = useRoleAccess();
  const { isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isLoading) return;
    if (!isAdminApiAuth) {
      router.replace(ROUTES.login);
    }
  }, [isAdminApiAuth, isLoading, router]);

  return { isAdminApiAuth, isLoading };
}
