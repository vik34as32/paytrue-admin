"use client";

import { useTheme } from "next-themes";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import { resolvePrimaryBalance } from "@/lib/walletBalance";
import { resolveAdminPrimaryBalance } from "@/store/selectors/adminSelectors";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { ROLES, ROUTES } from "@/constants";
import { useRef, useEffect, useState } from "react";
import { logoutUser } from "@/store/api/authApi";
import { superAdminLogout } from "@/store/api/superAdminAuthApi";
import { useRoleAccess } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  LogOut,
  Moon,
  Sun,
  Bell,
  Menu,
  Search,
  Wallet,
} from "lucide-react";
import { Input } from "@/components/common/Input";
import Link from "next/link";

interface NavbarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

export function Navbar({ onMenuClick, sidebarCollapsed }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const superAdminWallet = useAppSelector((state) => state.superAdminWallet);
  const superAdminAuth = useAppSelector((state) => state.superAdminAuth);
  const adminBalance = useAppSelector((state) => state.adminModule.balance);
  const { user: displayUser, isSuperAdminApiAuth, isAdminApiAuth } = useRoleAccess();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = displayUser?.role === "super_admin";
  const showVirtualWallet = isSuperAdmin && isSuperAdminApiAuth;

  const headerBalance = isSuperAdminApiAuth
    ? resolvePrimaryBalance(superAdminWallet.balance)
    : isAdminApiAuth
      ? resolveAdminPrimaryBalance(adminBalance)
      : displayUser?.balance ?? 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <header
      className={cn(
        "fixed top-0 z-30 flex h-16 items-center border-b border-border bg-navbar/95 backdrop-blur-md px-4 transition-all duration-300 lg:px-6",
        "right-0 left-0",
        sidebarCollapsed ? "lg:left-[80px]" : "lg:left-[260px]"
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-background hover:text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden w-72 md:block">
            <Input
              placeholder="Search transactions, users..."
              icon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {displayUser && (
            <div className="hidden items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary sm:flex">
              <Wallet className="h-3.5 w-3.5" />
              {formatCurrency(headerBalance)}
            </div>
          )}

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-xl p-2 text-muted transition-colors hover:bg-background hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button className="relative rounded-xl p-2 text-muted transition-colors hover:bg-background hover:text-foreground">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent-red" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-background"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-sm font-bold text-white">
                {displayUser?.avatar ? (
                  <img
                    src={displayUser.avatar}
                    alt={displayUser.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(displayUser?.name || "U")
                )}
              </div>
              <div className="hidden text-left lg:block">
                <p className="text-sm font-semibold text-foreground">{displayUser?.name}</p>
                <p className="text-xs text-muted">{displayUser ? ROLES[displayUser.role] : ""}</p>
              </div>
            </button>

            {isOpen && (
              <div className="absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                <div className="border-b border-border px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary font-bold text-white">
                      {getInitials(displayUser?.name || "U")}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{displayUser?.name}</h3>
                      <p className="text-sm text-muted">{displayUser ? ROLES[displayUser.role] : ""}</p>
                    </div>
                  </div>
                </div>

                <div className="mx-4 my-4 rounded-xl bg-gradient-to-r from-primary to-secondary p-4 text-white">
                  <p className="text-xs opacity-80">Wallet Balance</p>
                  <h2 className="mt-1 text-xl font-bold">
                    {formatCurrency(headerBalance)}
                  </h2>
                </div>

                <Link
                  href={ROUTES.profile}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-5 py-3 text-sm text-foreground transition-colors hover:bg-background"
                >
                  <User className="h-4 w-4" />
                  My Profile
                </Link>

                <Link
                  href={
                    isSuperAdminApiAuth
                      ? ROUTES.superAdminChangePassword
                      : isAdminApiAuth
                        ? ROUTES.adminChangePassword
                        : ROUTES.profile
                  }
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-5 py-3 text-sm text-foreground transition-colors hover:bg-background"
                >
                  <Lock className="h-4 w-4" />
                  Change Password
                </Link>

                {showVirtualWallet && (
                  <Link
                    href={ROUTES.superAdminAddBalance}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-5 py-3 text-sm text-foreground transition-colors hover:bg-background"
                  >
                    <Wallet className="h-4 w-4" />
                    Add Balance
                  </Link>
                )}

                <div className="border-t border-border">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-5 py-3 text-sm text-accent-red transition-colors hover:bg-accent-red/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
