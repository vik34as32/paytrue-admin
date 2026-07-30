"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  User,
  Wallet,
  Mail,
  Phone,
  Hash,
  IndianRupee,
  Lock,
  Landmark,
  CircleDollarSign,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/common/Button";
import { WalletRoleBadge } from "@/components/wallet-management/WalletRoleBadge";
import {
  WalletStatusBadge,
  WalletVerificationBadge,
} from "@/components/wallet-management/WalletStatusBadge";
import { useWalletDetails } from "@/hooks/useWalletDetails";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface WalletDetailsDrawerProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
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

function BalanceCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-gradient-to-br p-3", accent)}>
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-lg bg-card/80 p-1.5 shadow-sm">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {label}
        </p>
      </div>
      <p className="text-base font-bold text-foreground">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

export function WalletDetailsDrawer({
  userId,
  open,
  onClose,
}: WalletDetailsDrawerProps) {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useWalletDetails(userId, open);

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message || "Failed to load wallet details");
    }
  }, [isError, error]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close drawer overlay"
            className="fixed inset-0 z-[70] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Wallet details"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[500px] flex-col border-l border-border bg-card shadow-2xl sm:w-[500px]"
          >
            <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Wallet Details
                </p>
                <h2 className="mt-1 text-lg font-bold text-foreground">
                  {data?.name || "User Wallet"}
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  {data?.userCode || data?.userId || "—"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  aria-label="Refresh details"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                  />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {isLoading ? (
                <div className="space-y-4" aria-busy="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-24 animate-pulse rounded-2xl bg-muted/20"
                    />
                  ))}
                </div>
              ) : isError ? (
                <div className="rounded-2xl border border-border bg-card p-6 text-center">
                  <p className="text-sm text-muted">
                    {error?.message || "Unable to load wallet details."}
                  </p>
                  <Button className="mt-4" onClick={() => refetch()}>
                    Retry
                  </Button>
                </div>
              ) : data ? (
                <div className="space-y-4">
                  <section className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 border-b border-border/70 pb-2">
                      <User className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold text-foreground">
                        User Information
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Name" value={data.name} />
                      <Field label="User Code" value={data.userCode} />
                      <div className="flex items-start gap-2 sm:col-span-2">
                        <Mail className="mt-0.5 h-3.5 w-3.5 text-muted" />
                        <Field label="Email" value={data.email} />
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="mt-0.5 h-3.5 w-3.5 text-muted" />
                        <Field label="Mobile" value={data.mobile} />
                      </div>
                      <div className="flex items-start gap-2">
                        <Hash className="mt-0.5 h-3.5 w-3.5 text-muted" />
                        <Field
                          label="Created"
                          value={formatDate(data.createdAt, "dd MMM yyyy")}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 sm:col-span-2">
                        <WalletRoleBadge role={data.role} />
                        <WalletStatusBadge status={data.status} />
                        <WalletVerificationBadge
                          status={data.verificationStatus}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 border-b border-border/70 pb-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold text-foreground">
                        Wallet Information
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field
                        label="Wallet Status"
                        value={data.wallet?.status || "—"}
                      />
                      <Field
                        label="Currency"
                        value={data.wallet?.currency || "INR"}
                      />
                      <Field
                        label="Shop"
                        value={data.outlet?.shopName || null}
                      />
                      <Field
                        label="Shop Address"
                        value={data.outlet?.shopAddress || null}
                      />
                    </div>
                  </section>

                  <section className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 border-b border-border/70 pb-2">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold text-foreground">
                        Balances
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <BalanceCard
                        label="Main Wallet"
                        value={data.mainWallet}
                        icon={Wallet}
                        accent="from-indigo-500/10 to-transparent"
                      />
                      <BalanceCard
                        label="Commission Wallet"
                        value={data.commissionWallet}
                        icon={CircleDollarSign}
                        accent="from-orange-500/10 to-transparent"
                      />
                      <BalanceCard
                        label="AEPS Wallet"
                        value={data.aepsWallet}
                        icon={Landmark}
                        accent="from-teal-500/10 to-transparent"
                      />
                      <BalanceCard
                        label="Hold Balance"
                        value={data.holdBalance}
                        icon={Lock}
                        accent="from-rose-500/10 to-transparent"
                      />
                      <BalanceCard
                        label="Available Balance"
                        value={data.availableBalance}
                        icon={IndianRupee}
                        accent="from-emerald-500/10 to-transparent"
                      />
                      <BalanceCard
                        label="Total Balance"
                        value={data.totalBalance}
                        icon={CircleDollarSign}
                        accent="from-blue-500/10 to-transparent"
                      />
                    </div>
                  </section>
                </div>
              ) : null}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
