"use client";

import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AuthRestoreLoader } from "@/components/common/AuthRestoreLoader";

interface AdminPageShellProps {
  children: React.ReactNode;
}

export function AdminPageShell({ children }: AdminPageShellProps) {
  const { isAdminApiAuth, isRestoring } = useAdminGuard();

  if (isRestoring) {
    return <AuthRestoreLoader />;
  }

  if (!isAdminApiAuth) {
    return <AuthRestoreLoader />;
  }

  return <>{children}</>;
}
