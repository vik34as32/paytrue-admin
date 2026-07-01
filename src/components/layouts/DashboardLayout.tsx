"use client";

import { useState, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Navbar } from "@/components/navbar/Navbar";
import { useAuthGuard } from "@/hooks/useAuth";
import { useAppDispatch } from "@/hooks/useAppStore";
import { loadStoredUser } from "@/store/api/authApi";
import { loadStoredSuperAdmin } from "@/store/api/superAdminAuthApi";
import { loadAdminSession } from "@/store/api/adminModuleApi";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useAppDispatch();

  useAuthGuard();

  // Restore persisted auth before route-guard effects run on refresh.
  useLayoutEffect(() => {
    dispatch(loadStoredUser());
    dispatch(loadStoredSuperAdmin());
    dispatch(loadAdminSession());
  }, [dispatch]);

  return (
    <div className="h-screen overflow-hidden bg-background">
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
        {children}
      </main>
    </div>
  );
}
