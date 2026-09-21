"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SIDEBAR_ITEMS, ADMIN_SIDEBAR_ITEMS, APP_NAME, ROUTES } from "@/constants";
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
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-white/10 bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-[80px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 bg-transparent px-5">
  {!collapsed && (
    <Link
      href={homeHref}
      className="group flex items-center gap-3 transition-all duration-200"
    >
      <div className="flex items-center">
  <img
    src="/images/logo.png"
    alt="PayTrue Logo"
    width={250}
    height={250}
    className="h-10 w-auto object-contain"
  />
</div>

      {/* Brand */}
      <div className="flex flex-col leading-none">
        <h1 className="text-2xl font-extrabold tracking-tight">
          <span className="text-white">
            Pay
          </span>

          <span className="bg-gradient-to-r from-[#F7D774] to-[#C5A059] bg-clip-text text-transparent">
            true 
          </span>
        </h1>

        {/* <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
          DIGITAL PAYMENT SOLUTIONS
        </span> */}
      </div>
    </Link>
  )}

  <button
    onClick={onToggle}
    className="hidden rounded-xl border border-white/15 bg-white/5 p-2 text-sidebar-muted shadow-sm transition-all duration-200 hover:bg-white/10 hover:text-white lg:flex"
  >
    {collapsed ? (
      <ChevronRight className="h-5 w-5" />
    ) : (
      <ChevronLeft className="h-5 w-5" />
    )}
  </button>
</div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
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

            return (
              <div key={item.href}>
                {showSection && !collapsed ? (
                  <p className="mb-1 mt-3 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
                    {section}
                  </p>
                ) : null}
                {showSection && collapsed ? (
                  <div className="my-2 border-t border-border/70" />
                ) : null}
                {granted ? (
                  <Link
                    href={item.href}
                    onClick={onMobileClose}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                        : "text-sidebar-muted hover:bg-white/8 hover:text-sidebar-foreground"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    {iconMap[item.icon]}
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                ) : (
                  <button
                    type="button"
                    title="You don't have permission to use this service."
                    onClick={() => notifyLocked()}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
                  >
                    {iconMap[item.icon]}
                    {!collapsed && (
                      <span className="flex flex-1 items-center justify-between gap-2">
                        {item.label}
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide">
                          <Lock className="h-3.5 w-3.5" />
                          Locked
                        </span>
                      </span>
                    )}
                  </button>
                )}
              </div>
            );
          })}
          {userRole === "admin" && !isSuperAdmin && groups.length ? (
            <div className="pt-2">
              {!collapsed ? (
                <p className="mb-1 mt-3 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
                  Services
                </p>
              ) : (
                <div className="my-2 border-t border-border/70" />
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
                    title={
                      granted
                        ? group.serviceType
                        : "You don't have permission to use this service."
                    }
                    onClick={() => {
                      if (!granted) {
                        notifyLocked();
                        return;
                      }
                      toast.message(`${group.serviceType} is enabled for your account.`);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                      granted
                        ? "text-sidebar-muted hover:bg-white/10 hover:text-sidebar-foreground"
                        : "text-sidebar-muted/60"
                    )}
                  >
                    <Lock className={cn("h-5 w-5", granted && "hidden")} />
                    <ShieldCheck className={cn("h-5 w-5", !granted && "hidden")} />
                    {!collapsed && (
                      <span className="flex flex-1 items-center justify-between gap-2">
                        {group.serviceType}
                        <span className="text-[11px] font-semibold uppercase tracking-wide">
                          {granted ? "Enabled" : "Locked"}
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : null}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-300 transition-all hover:bg-rose-500/15"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
