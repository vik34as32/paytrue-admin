"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { useAdminGuard } from "@/hooks/useAdminGuard";

export default function AdminIndexPage() {
  const router = useRouter();
  const { isAdminApiAuth, isLoading } = useAdminGuard();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAdminApiAuth ? ROUTES.adminDashboard : ROUTES.login);
  }, [isAdminApiAuth, isLoading, router]);

  return null;
}
