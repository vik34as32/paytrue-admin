"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SIDEBAR_ITEMS, APP_NAME, ROUTES } from "@/constants";
import {
  HiOutlineViewGrid,
  HiOutlineUsers,
  HiOutlineSwitchHorizontal,
  HiOutlineCurrencyRupee,
  HiOutlineClipboardList,
  HiOutlineDocumentReport,
  HiOutlineBookOpen,
  HiOutlineStatusOnline,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineLogout,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";
import { useAppDispatch } from "@/hooks/useAppStore";
import { logoutUser } from "@/store/api/authApi";
import { useRouter } from "next/navigation";
import { useRoleAccess } from "@/hooks/useAuth";

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <HiOutlineViewGrid className="h-5 w-5" />,
  users: <HiOutlineUsers className="h-5 w-5" />,
  transactions: <HiOutlineSwitchHorizontal className="h-5 w-5" />,
  transfer: <HiOutlineCurrencyRupee className="h-5 w-5" />,
  requests: <HiOutlineClipboardList className="h-5 w-5" />,
  reports: <HiOutlineDocumentReport className="h-5 w-5" />,
  ledger: <HiOutlineBookOpen className="h-5 w-5" />,
  hierarchy: <HiOutlineStatusOnline className="h-5 w-5" />,
  history: <HiOutlineClock className="h-5 w-5" />,
  profile: <HiOutlineUser className="h-5 w-5" />,
  settings: <HiOutlineCog className="h-5 w-5" />,
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
  const { canTransferBalance, canApproveRequests, canRequestBalance, isSuperAdmin } =
    useRoleAccess();

  const filteredItems = SIDEBAR_ITEMS.filter((item) => {
    if (item.href === ROUTES.balanceTransfer && !canTransferBalance)
      return false;
    if (
      item.href === ROUTES.requests &&
      !canApproveRequests &&
      !canRequestBalance
    )
      return false;
    if (item.href === ROUTES.users && !isSuperAdmin) return false;
    return true;
  });

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push(ROUTES.login);
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
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
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <Link href={ROUTES.dashboard} className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl  text-white font-bold text-sm">
                <img src="/images/logo.png" alt="logo" />
              </div>
              <span className="font-bold text-foreground">{APP_NAME}</span>
            </Link>
          )}
          <button
            onClick={onToggle}
            className="hidden rounded-lg p-1.5 text-muted hover:bg-background lg:block"
          >
            {collapsed ? (
              <HiChevronRight className="h-5 w-5" />
            ) : (
              <HiChevronLeft className="h-5 w-5" />
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
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-accent-red hover:bg-accent-red/10 transition-all"
          >
            <HiOutlineLogout className="h-5 w-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
