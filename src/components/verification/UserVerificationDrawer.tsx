"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Mail,
  Phone,
  Wallet,
  X,
  FileImage,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { NetworkUserAvatar } from "@/components/super-admin/NetworkUserAvatar";
import { DocumentGallery } from "@/components/verification/DocumentThumbStack";
import { VerificationBadge } from "@/components/verification/VerificationBadge";
import { VerificationCard } from "@/components/verification/VerificationCard";
import { VerificationTimeline } from "@/components/verification/VerificationTimeline";
import { VerificationActions } from "@/components/verification/VerificationActions";
import { useVerification } from "@/hooks/useIdVerification";
import { useVerificationWorkflow } from "@/hooks/useVerificationWorkflow";
import {
  getUserVerificationStatus,
} from "@/lib/idVerification";
import {
  formatUserTypeLabel,
  getNetworkUserName,
  getUserAadhaarNumber,
  getUserOutletName,
  getUserPanNumber,
  getWalletBalance,
} from "@/lib/normalizeUser";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { getAdminUserById } from "@/services/adminUsersApi";
import { getUserById } from "@/services/userApi";
import { NetworkUserRecord, UserDetailRecord } from "@/types/superAdmin";

function getVerificationDisplayName(user: NetworkUserRecord): string {
  const first = (user.firstName || "").trim();
  if (first) return first;
  const fromFull = (user.name || getNetworkUserName(user) || "").trim();
  if (!fromFull) return "—";
  return fromFull.split(/\s+/)[0] || fromFull;
}

interface UserVerificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: NetworkUserRecord | null;
  mode: "admin" | "super_admin";
  onUpdated?: () => void;
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 border-b border-border/70 pb-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">
        {value?.trim() ? value : "—"}
      </p>
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className="space-y-4 p-5" aria-busy="true">
      <div className="flex gap-3">
        <div className="h-14 w-14 animate-pulse rounded-2xl bg-muted/30" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-muted/30" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted/20" />
        </div>
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-2xl border border-border bg-muted/15"
        />
      ))}
    </div>
  );
}

export function UserVerificationDrawer({
  isOpen,
  onClose,
  user,
  mode,
  onUpdated,
}: UserVerificationDrawerProps) {
  const [detail, setDetail] = useState<UserDetailRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verificationQuery = useVerification(user?.id, isOpen && !!user?.id);
  const workflow = useVerificationWorkflow(() => {
    void verificationQuery.refetch();
    onUpdated?.();
  });

  useEffect(() => {
    if (!isOpen || !user?.id) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const loader =
      mode === "admin"
        ? getAdminUserById(user.id)
        : getUserById(user.id);

    void loader
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setDetail(null);
          setError(
            err instanceof Error ? err.message : "Failed to load user details"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, user?.id, mode]);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const activeUser = detail || user;
  const status = getUserVerificationStatus(
    verificationQuery.data || activeUser || {}
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && user ? (
          <div className="fixed inset-0 z-[110]" role="dialog" aria-modal="true">
            <motion.button
              type="button"
              aria-label="Close drawer overlay"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className={cn(
                "absolute inset-y-0 right-0 flex w-full max-w-xl flex-col",
                "border-l border-border bg-background shadow-2xl"
              )}
            >
              <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    User details
                  </p>
                  <h2 className="truncate text-lg font-bold text-foreground">
                    {getVerificationDisplayName(user)}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <VerificationBadge status={status} />
                    <span className="text-xs text-muted">
                      {formatUserTypeLabel(user.userType || user.role)}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Close drawer"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </header>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <DrawerSkeleton />
                ) : error ? (
                  <div className="p-5 text-sm text-accent-red">{error}</div>
                ) : activeUser ? (
                  <div className="space-y-4 p-5">
                    <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-4">
                      <div className="flex items-start gap-3">
                        <NetworkUserAvatar user={activeUser} size="lg" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <p className="font-mono text-xs text-muted">
                            {activeUser.userCode || activeUser.id}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted" />
                            <span className="truncate">
                              {activeUser.email || "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3.5 w-3.5 text-muted" />
                            <span>
                              {activeUser.mobile ||
                                (typeof activeUser.phone === "string"
                                  ? activeUser.phone
                                  : "—")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <VerificationActions
                          status={status}
                          canManage
                          compact
                          disabled={workflow.isBusy}
                          onVerify={() => workflow.openVerify(user)}
                          onReject={() => workflow.openReject(user)}
                          onViewDetails={() =>
                            workflow.openDetails(
                              user,
                              verificationQuery.data
                            )
                          }
                          onViewReason={() =>
                            workflow.openReason(user, verificationQuery.data)
                          }
                        />
                      </div>
                    </div>

                    <Section title="Basic Details" icon={Activity}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                          label="Name"
                          value={getVerificationDisplayName(activeUser)}
                        />
                        <Field
                          label="Role"
                          value={formatUserTypeLabel(
                            activeUser.userType || activeUser.role
                          )}
                        />
                        <Field label="Status" value={activeUser.status} />
                        <Field
                          label="Outlet"
                          value={getUserOutletName(activeUser)}
                        />
                        <Field
                          label="Created"
                          value={
                            activeUser.createdAt
                              ? formatDate(activeUser.createdAt)
                              : undefined
                          }
                        />
                        <Field
                          label="Email Verified"
                          value={
                            detail?.isEmailVerified == null
                              ? undefined
                              : detail.isEmailVerified
                                ? "Yes"
                                : "No"
                          }
                        />
                      </div>
                    </Section>

                    <Section title="KYC" icon={ShieldCheck}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                          label="Aadhaar"
                          value={getUserAadhaarNumber(activeUser)}
                        />
                        <Field
                          label="PAN"
                          value={getUserPanNumber(activeUser)}
                        />
                        <Field
                          label="KYC Status"
                          value={
                            detail?.kycStatus ||
                            detail?.kyc?.kycStatus ||
                            detail?.kyc?.status
                          }
                        />
                      </div>
                    </Section>

                    <Section title="Documents" icon={FileImage}>
                      <DocumentGallery user={activeUser} />
                    </Section>

                    <Section title="Verification" icon={ShieldCheck}>
                      <VerificationCard
                        userId={user.id}
                        userName={getVerificationDisplayName(user)}
                        fallbackStatus={status}
                        canManage
                        showHistory={false}
                        onUpdated={() => {
                          void verificationQuery.refetch();
                          onUpdated?.();
                        }}
                      />
                      <div className="mt-4 rounded-xl border border-border/70 bg-background/60 p-3">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
                          Timeline
                        </p>
                        <VerificationTimeline
                          info={verificationQuery.data}
                          statusFallback={status}
                        />
                      </div>
                    </Section>

                    <Section title="Wallet" icon={Wallet}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                          label="Balance"
                          value={formatCurrency(getWalletBalance(activeUser))}
                        />
                        <Field
                          label="Wallet Status"
                          value={detail?.wallet?.status}
                        />
                      </div>
                    </Section>

                    <Section title="Recent Activity" icon={Activity}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                          label="Last Login"
                          value={
                            detail?.lastLoginAt
                              ? formatDate(detail.lastLoginAt)
                              : undefined
                          }
                        />
                        <Field
                          label="Last Login IP"
                          value={detail?.lastLoginIp}
                        />
                        <Field
                          label="Mobile Verified At"
                          value={
                            detail?.mobileVerifiedAt
                              ? formatDate(detail.mobileVerifiedAt)
                              : undefined
                          }
                        />
                        <Field
                          label="Updated"
                          value={
                            detail?.updatedAt
                              ? formatDate(detail.updatedAt)
                              : undefined
                          }
                        />
                      </div>
                    </Section>
                  </div>
                ) : null}
              </div>
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>

      {workflow.dialogs}
    </>,
    document.body
  );
}
