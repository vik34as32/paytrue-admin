"use client";

import { Modal } from "@/components/modals/Modal";
import { NetworkUserAvatar } from "@/components/super-admin/NetworkUserAvatar";
import {
  AdminDetailSections,
  StatusBadge,
  getAdminDisplayName,
  getAdminBalance,
  getAdminId,
} from "@/components/super-admin/AdminDetailSections";
import { formatAdminUserType } from "@/lib/normalizeAdmin";
import { AdminDetailRecord } from "@/types/superAdmin";
import { formatCurrency } from "@/lib/utils";
import { Mail, Phone, Wallet, Hash, Shield } from "lucide-react";

interface AdminViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: AdminDetailRecord | null;
  isLoading?: boolean;
}

export function AdminViewModal({
  isOpen,
  onClose,
  admin,
  isLoading = false,
}: AdminViewModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin Profile"
      subtitle={admin ? getAdminDisplayName(admin) : "Complete admin information"}
      size="2xl"
    >
      {isLoading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : admin ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <NetworkUserAvatar user={admin} size="lg" />
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {getAdminDisplayName(admin)}
                  </h3>
                  <p className="text-sm text-muted">
                    {formatAdminUserType(admin.userType)}
                    {admin.userCode ? ` · ${admin.userCode}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={admin.status} />
                  {admin.mobileVerified !== undefined && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      Mobile {admin.mobileVerified ? "Verified" : "Unverified"}
                    </span>
                  )}
                  {admin.isEmailVerified !== undefined && (
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      Email {admin.isEmailVerified ? "Verified" : "Unverified"}
                    </span>
                  )}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Mail className="h-4 w-4 shrink-0 text-muted" />
                    <span className="truncate">{admin.email || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Phone className="h-4 w-4 shrink-0 text-muted" />
                    <span>{admin.mobile || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Wallet className="h-4 w-4 shrink-0 text-muted" />
                    <span>{formatCurrency(getAdminBalance(admin))}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Shield className="h-4 w-4 shrink-0 text-muted" />
                    <span className="font-mono text-xs">{getAdminId(admin)}</span>
                  </div>
                  {admin.userCode && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Hash className="h-4 w-4 shrink-0 text-muted" />
                      <span className="font-mono">{admin.userCode}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <AdminDetailSections admin={admin} />
        </div>
      ) : (
        <p className="text-sm text-muted">No admin details available.</p>
      )}
    </Modal>
  );
}
