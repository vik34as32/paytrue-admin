"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AuthRestoreLoader } from "@/components/common/AuthRestoreLoader";

export default function AdminIndexPage() {
  const router = useRouter();
  const { isAdminApiAuth, isRestoring } = useAdminGuard();

  useEffect(() => {
    if (isRestoring) return;
    router.replace(isAdminApiAuth ? ROUTES.adminDashboard : ROUTES.login);
  }, [isAdminApiAuth, isRestoring, router]);

  return <AuthRestoreLoader />;
}
