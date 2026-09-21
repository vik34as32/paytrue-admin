"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Navbar } from "@/components/navbar/Navbar";
import { useAuthGuard, useRoleAccess } from "@/hooks/useAuth";
import { useAppSelector } from "@/hooks/useAppStore";
import { selectIsAuthRestoring } from "@/store/selectors/authSelectors";
import { AuthRestoreLoader } from "@/components/common/AuthRestoreLoader";
import { PermissionAccessProvider } from "@/components/permissions/PermissionAccessProvider";
import { PageTransition } from "@/components/layouts/PageTransition";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isRestoring = useAppSelector(selectIsAuthRestoring);
  const { isSuperAdmin, isAdminApiAuth } = useRoleAccess();

  useAuthGuard();

  if (isRestoring) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <AuthRestoreLoader />
      </div>
    );
  }

  const portalClass = isSuperAdmin
    ? "portal-sa"
    : isAdminApiAuth
      ? "portal-admin"
      : "portal-admin";

  return (
    <PermissionAccessProvider>
      <div className={cn("h-screen overflow-hidden bg-background", portalClass)}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <Navbar
          onMenuClick={() => setMobileOpen(true)}
          sidebarCollapsed={collapsed}
        />
        <main
          className={cn(
            "fixed bottom-0 right-0 z-0 overflow-x-hidden overflow-y-auto",
            "px-4 pb-6 pt-4 transition-all duration-300 lg:px-6 lg:pb-8 lg:pt-6",
            "top-[var(--app-header-height)] left-0",
            collapsed
              ? "lg:left-[var(--app-sidebar-width-collapsed)]"
              : "lg:left-[var(--app-sidebar-width)]"
          )}
        >
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </PermissionAccessProvider>
  );
}
