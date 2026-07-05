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
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
  Building2,
  ShoppingBag,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { logoutUser } from "@/store/api/authApi";
import { superAdminLogout } from "@/store/api/superAdminAuthApi";
import { useRouter } from "next/navigation";
import { useRoleAccess } from "@/hooks/useAuth";
import { UserRole } from "@/types";

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
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-border bg-sidebar transition-all duration-300",
          collapsed ? "w-[80px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5">
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
          <span className="text-[#001F5B]">
            Pay
          </span>

          <span className="bg-gradient-to-r from-[#0A84FF] to-[#0057D9] bg-clip-text text-transparent">
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
    className="hidden rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:text-[#1E88FF] hover:shadow-md lg:flex"
  >
    {collapsed ? (
      <ChevronRight className="h-5 w-5" />
    ) : (
      <ChevronLeft className="h-5 w-5" />
    )}
  </button>
</div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {filteredItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-muted hover:bg-background hover:text-foreground"
                )}
                title={collapsed ? item.label : undefined}
              >
                {iconMap[item.icon]}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-accent-red transition-all hover:bg-accent-red/10"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
