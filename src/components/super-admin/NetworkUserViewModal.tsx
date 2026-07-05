"use client";

import { Modal } from "@/components/modals/Modal";
import { NetworkUserAvatar } from "@/components/super-admin/NetworkUserAvatar";
import {
  StatusBadge,
  UserDetailSections,
} from "@/components/super-admin/NetworkUserDetailSections";
import { UserDetailRecord } from "@/types/superAdmin";
import {
  formatUserTypeLabel,
  getNetworkUserName,
  getUserOutletName,
  getWalletBalance,
} from "@/lib/normalizeUser";
import { formatCurrency } from "@/lib/utils";
import { Mail, Phone, MapPin, Wallet, Hash } from "lucide-react";

interface NetworkUserViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDetailRecord | null;
  isLoading?: boolean;
}

export function NetworkUserViewModal({
  isOpen,
  onClose,
  user,
  isLoading = false,
}: NetworkUserViewModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Profile"
      subtitle={user ? getNetworkUserName(user) : "Complete user information"}
      size="2xl"
    >
      {isLoading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : user ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <NetworkUserAvatar user={user} size="lg" />
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {getNetworkUserName(user)}
                  </h3>
                  <p className="text-sm text-muted">
                    {formatUserTypeLabel(user.userType)}
                    {user.userCode ? ` · ${user.userCode}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={user.status} />
                  {user.mobileVerified !== undefined && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      Mobile {user.mobileVerified ? "Verified" : "Unverified"}
                    </span>
                  )}
                  {user.isEmailVerified !== undefined && (
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      Email {user.isEmailVerified ? "Verified" : "Unverified"}
                    </span>
                  )}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Mail className="h-4 w-4 shrink-0 text-muted" />
                    <span className="truncate">{user.email || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Phone className="h-4 w-4 shrink-0 text-muted" />
                    <span>{user.mobile || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <MapPin className="h-4 w-4 shrink-0 text-muted" />
                    <span className="truncate">
                      {getUserOutletName(user)} · {user.city || user.outlet?.city || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Wallet className="h-4 w-4 shrink-0 text-muted" />
                    <span>{formatCurrency(getWalletBalance(user))}</span>
                  </div>
                  {user.userCode && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Hash className="h-4 w-4 shrink-0 text-muted" />
                      <span className="font-mono">{user.userCode}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <UserDetailSections user={user} />
        </div>
      ) : (
        <p className="text-sm text-muted">No user details available.</p>
      )}
    </Modal>
  );
}
