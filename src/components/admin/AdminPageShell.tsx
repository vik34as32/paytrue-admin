"use client";

import { useAdminGuard } from "@/hooks/useAdminGuard";

interface AdminPageShellProps {
  children: React.ReactNode;
}

export function AdminPageShell({ children }: AdminPageShellProps) {
  const { isAdminApiAuth, isLoading } = useAdminGuard();

  if (isLoading || !isAdminApiAuth) return null;

  return <>{children}</>;
}
