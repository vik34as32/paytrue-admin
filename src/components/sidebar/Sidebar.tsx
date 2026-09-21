"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SIDEBAR_ITEMS, ADMIN_SIDEBAR_ITEMS, ROUTES } from "@/constants";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  IndianRupee,
  ClipboardList,
  FileBarChart,
  BookOpen,
  Network,
  Clock,
  User,
  Settings,
  Percent,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
  Building2,
  ShoppingBag,
  Layers,
  ShieldCheck,
  BadgeCheck,
  Wallet,
  Lock,
  Receipt,
  Landmark,
  ScrollText,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { logoutUser } from "@/store/api/authApi";
import { superAdminLogout } from "@/store/api/superAdminAuthApi";
import { useRouter } from "next/navigation";
import { useRoleAccess } from "@/hooks/useAuth";
import { usePermissionAccess } from "@/components/permissions/PermissionAccessProvider";
import { UserRole } from "@/types";
import { toast } from "sonner";
import { InfoTooltip } from "@/components/common/InfoTooltip";
import { getSectionHelp } from "@/lib/sectionHelp";

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard className="h-5 w-5" />,
  users: <Users className="h-5 w-5" />,
  masterDistributor: <Building2 className="h-5 w-5" />,
  distributor: <Store className="h-5 w-5" />,
  retailer: <ShoppingBag className="h-5 w-5" />,
  transactions: <ArrowLeftRight className="h-5 w-5" />,
  transfer: <IndianRupee className="h-5 w-5" />,
  requests: <ClipboardList className="h-5 w-5" />,
  reports: <FileBarChart className="h-5 w-5" />,
  ledger: <BookOpen className="h-5 w-5" />,
  hierarchy: <Network className="h-5 w-5" />,
  history: <Clock className="h-5 w-5" />,
  profile: <User className="h-5 w-5" />,
  settings: <Settings className="h-5 w-5" />,
  commission: <Percent className="h-5 w-5" />,
  services: <Layers className="h-5 w-5" />,
  permissions: <ShieldCheck className="h-5 w-5" />,
  verification: <BadgeCheck className="h-5 w-5" />,
  wallet: <Wallet className="h-5 w-5" />,
  lien: <Lock className="h-5 w-5" />,
  serviceCharges: <Receipt className="h-5 w-5" />,
  aepsLedger: <Landmark className="h-5 w-5" />,
  logs: <ScrollText className="h-5 w-5" />,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const superAdminAuth = useAppSelector((state) => state.superAdminAuth);
  const { canTransferBalance, canApproveRequests, canRequestBalance } =
    useRoleAccess();
  const { isHrefAllowed, notifyLocked, groups, permissionKeys, isSuperAdmin } =
    usePermissionAccess();

  const userRole: UserRole = superAdminAuth.isAuthenticated
    ? "super_admin"
    : ((user?.role || "retailer") as UserRole);

  const filteredItems =
    userRole === "admin"
      ? ADMIN_SIDEBAR_ITEMS
      : SIDEBAR_ITEMS.filter((item) => {
          const roles = item.roles as readonly UserRole[];
          if (!roles.includes(userRole)) return false;
          if (item.href === ROUTES.balanceTransfer && !canTransferBalance)
            return false;
          if (
            item.href === ROUTES.requests &&
            !canApproveRequests &&
            !canRequestBalance
          )
            return false;
          return true;
        });

  const homeHref = superAdminAuth.isAuthenticated
    ? ROUTES.superAdminDashboard
    : userRole === "admin"
      ? ROUTES.adminDashboard
      : ROUTES.dashboard;

  const handleLogout = async () => {
    if (superAdminAuth.isAuthenticated) {
      await dispatch(superAdminLogout());
      router.push(ROUTES.superAdminLogin);
    } else {
      await dispatch(logoutUser());
      router.push(ROUTES.login);
    }
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={cn(
          "sidebar-shell fixed left-0 top-0 z-50 flex h-full flex-col text-sidebar-foreground",
          collapsed ? "w-[80px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="relative flex h-16 items-center justify-between border-b border-white/10 px-4">
          {!collapsed && (
            <Link
              href={homeHref}
              className="group flex min-w-0 items-center gap-2.5"
            >
              <img
                src="/images/logo.png"
                alt="PayTrue Logo"
                width={250}
                height={250}
                className="h-10 w-auto object-contain"
              />
              <div className="flex min-w-0 flex-col leading-none">
                <h1 className="text-2xl font-extrabold tracking-tight">
                  <span className="text-white">Pay</span>
                  <span className="bg-gradient-to-r from-[#F7D774] to-[#C5A059] bg-clip-text text-transparent">
                    true
                  </span>
                </h1>
              </div>
            </Link>
          )}

          <button
            onClick={onToggle}
            className="sidebar-toggle hidden rounded-xl border border-white/15 bg-white/5 p-2 text-sidebar-muted lg:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        <nav className="sidebar-nav flex-1 space-y-1 overflow-y-auto p-3">
          {filteredItems.map((item, index) => {
            const isActive = pathname.startsWith(item.href);
            const section =
              "section" in item
                ? (item.section as string | undefined)
                : undefined;
            const prev = filteredItems[index - 1];
            const prevSection =
              prev && "section" in prev
                ? (prev.section as string | undefined)
                : undefined;
            const showSection = !!section && section !== prevSection;
            const granted = isHrefAllowed(item.href);
            const hint = getSectionHelp(item.href);

            return (
              <div
                key={item.href}
                className="sidebar-item-enter"
                style={{ animationDelay: `${Math.min(index, 18) * 28}ms` }}
              >
                {showSection && !collapsed ? (
                  <p className="sidebar-section-label mb-1 mt-3 px-3">
                    {section}
                  </p>
                ) : null}
                {showSection && collapsed ? (
                  <div className="my-2 border-t border-white/10" />
                ) : null}
                {granted ? (
                  <Link
                    href={item.href}
                    onClick={onMobileClose}
                    title={collapsed ? `${item.label} — ${hint}` : undefined}
                    className={cn(
                      "nav-link",
                      isActive ? "nav-link-active" : "nav-link-idle"
                    )}
                  >
                    <span className="nav-link-icon">{iconMap[item.icon]}</span>
                    {!collapsed && (
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    )}
                    {!collapsed && (
                      <InfoTooltip
                        content={hint}
                        side="right"
                        className="nav-link-help text-white/40 hover:text-white"
                        iconClassName="h-3.5 w-3.5"
                      />
                    )}
                    {collapsed && (
                      <span className="sr-only">{`${item.label}. ${hint}`}</span>
                    )}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => notifyLocked()}
                    className="nav-link nav-link-locked"
                  >
                    <span className="nav-link-icon">{iconMap[item.icon]}</span>
                    {!collapsed && (
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <span className="truncate">{item.label}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide">
                          <Lock className="h-3.5 w-3.5" />
                          Locked
                        </span>
                      </span>
                    )}
                    {!collapsed && (
                      <InfoTooltip
                        content="This module is locked for your account. Ask Super Admin to grant access."
                        side="right"
                        className="text-white/30"
                        iconClassName="h-3.5 w-3.5"
                      />
                    )}
                  </button>
                )}
              </div>
            );
          })}
          {userRole === "admin" && !isSuperAdmin && groups.length ? (
            <div className="pt-2">
              {!collapsed ? (
                <p className="sidebar-section-label mb-1 mt-3 px-3">Services</p>
              ) : (
                <div className="my-2 border-t border-white/10" />
              )}
              {groups.map((group) => {
                const granted = group.permissions.some((item) =>
                  permissionKeys.some(
                    (key) => key.toUpperCase() === item.key.toUpperCase()
                  )
                );
                return (
                  <button
                    key={group.serviceType}
                    type="button"
                    onClick={() => {
                      if (!granted) {
                        notifyLocked();
                        return;
                      }
                      toast.message(
                        `${group.serviceType} is enabled for your account.`
                      );
                    }}
                    className={cn(
                      "nav-link",
                      granted ? "nav-link-idle" : "nav-link-locked"
                    )}
                  >
                    <Lock className={cn("h-5 w-5", granted && "hidden")} />
                    <ShieldCheck
                      className={cn("h-5 w-5", !granted && "hidden")}
                    />
                    {!collapsed && (
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <span className="truncate">{group.serviceType}</span>
                        <span className="text-[11px] font-semibold uppercase tracking-wide">
                          {granted ? "Enabled" : "Locked"}
                        </span>
                      </span>
                    )}
                    {!collapsed && (
                      <InfoTooltip
                        content={
                          granted
                            ? `${group.serviceType} is enabled on this Admin account.`
                            : "You don't have permission to use this service."
                        }
                        side="right"
                        className="text-white/35"
                        iconClassName="h-3.5 w-3.5"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ) : null}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button onClick={handleLogout} className="nav-link nav-link-logout">
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
