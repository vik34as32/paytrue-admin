"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Navbar } from "@/components/navbar/Navbar";
import { useAuthGuard } from "@/hooks/useAuth";
import { useAppDispatch } from "@/hooks/useAppStore";
import { loadStoredUser } from "@/store/api/authApi";
import { mockApi } from "@/services/mockApi";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useAppDispatch();
  useAuthGuard();

  useEffect(() => {
    mockApi.init();
    dispatch(loadStoredUser());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-background">
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
          "min-h-screen pt-16 transition-all duration-300 p-4 lg:p-6",
          collapsed ? "lg:pl-[96px]" : "lg:pl-[276px]"
        )}
      >
        {children}
      </main>
    </div>
  );
}
