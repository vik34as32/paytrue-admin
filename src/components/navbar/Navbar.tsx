"use client";

import { useTheme } from "next-themes";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import { useAppSelector } from "@/hooks/useAppStore";
import { ROLES } from "@/constants";
import { useRef, useEffect, useState } from "react";


import {
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineLogout,
  HiOutlineCurrencyRupee,
} from "react-icons/hi";
import {
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineBell,
  HiOutlineMenu,
  HiOutlineSearch,
} from "react-icons/hi";
import { Input } from "@/components/common/Input";
import Link from "next/link";
import { ROUTES } from "@/constants";

interface NavbarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

export function Navbar({ onMenuClick, sidebarCollapsed }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 z-30 flex h-16 items-center border-b border-border bg-navbar px-4 transition-all duration-300 lg:px-6",
        "right-0 left-0",
        sidebarCollapsed ? "lg:left-[80px]" : "lg:left-[260px]",
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-muted hover:bg-background lg:hidden"
          >
            <HiOutlineMenu className="h-5 w-5" />
          </button>
          <div className="hidden w-64 md:block">
            <Input
              placeholder="Search..."
              icon={<HiOutlineSearch className="h-4 w-4" />}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary sm:block">
              Balance: {formatCurrency(user.balance)}
            </div>
          )}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-background"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-bold text-white">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(user?.name || "U")
                )}
              </div>

              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-foreground">
                  {user?.name}
                </p>
                <p className="text-xs text-muted">
                  {user ? ROLES[user.role] : ""}
                </p>
              </div>
            </button>

            {isOpen && (
              <div className="absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="border-b px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold">
                      {getInitials(user?.name || "U")}
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {user?.name}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {user ? ROLES[user.role] : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mx-4 my-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white">
                  <p className="text-xs opacity-80">Wallet Balance</p>

                  <h2 className="mt-1 text-xl font-bold">
                    {formatCurrency(user?.balance || 0)}
                  </h2>
                </div>

                <Link
                  href={ROUTES.profile}
                  className="flex items-center gap-3 px-5 py-3 text-slate-700 hover:bg-violet-50 hover:text-violet-600"
                >
                  <HiOutlineUser size={20} />
                  My Profile
                </Link>

                <Link
                  href="/change-password"
                  className="flex items-center gap-3 px-5 py-3 text-slate-700 hover:bg-violet-50 hover:text-violet-600"
                >
                  <HiOutlineLockClosed size={20} />
                  Change Password
                </Link>

                <Link
  href="/virtual-balance"
    onClick={() => setIsOpen(false)}

  className="flex items-center gap-3 px-5 py-3 text-slate-700 hover:bg-violet-50 hover:text-violet-600"
>
  <HiOutlineCurrencyRupee size={20} />
  Update Virtual Amount
</Link>

                <div className="border-t">
                  <button className="flex w-full items-center gap-3 px-5 py-3 text-red-500 hover:bg-red-50">
                    <HiOutlineLogout size={20} />
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
