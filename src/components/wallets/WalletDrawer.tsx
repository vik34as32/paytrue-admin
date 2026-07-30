"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  User,
  Wallet,
  Mail,
  Phone,
  Activity,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/common/Button";
import { WalletBadge } from "@/components/wallets/WalletBadge";
import { WalletSummaryCards } from "@/components/wallets/WalletSummaryCards";
import { WalletDrawerSkeleton } from "@/components/wallets/WalletSkeleton";
import { useWalletSummary } from "@/hooks/useWalletSummary";
import { formatCurrency, formatDate } from "@/lib/utils";

interface WalletDrawerProps {
  open: boolean;
  userId: string | null;
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

export function WalletDrawer({ open, userId, onClose }: WalletDrawerProps) {
  const panelRef = useRef<HTMLElement>(null);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useWalletSummary(userId, open);

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message || "Failed to load wallet summary");
    }
  }, [isError, error]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 50);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close wallet drawer overlay"
            className="fixed inset-0 z-[70] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Wallet summary"
            tabIndex={-1}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[520px] flex-col border-l border-border bg-card shadow-2xl outline-none sm:w-[520px]"
          >
            <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  View Wallet
                </p>
                <h2 className="mt-1 text-lg font-bold text-foreground">
                  {data?.name || "Wallet Summary"}
                </h2>
                <p className="text-sm text-muted">
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
                  aria-label="Refresh wallet summary"
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
                  aria-label="Close drawer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {isLoading ? (
                <WalletDrawerSkeleton />
              ) : isError ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-accent-red/30 bg-accent-red/5 p-5 text-center"
                >
                  <p className="text-sm text-foreground">
                    {error?.message || "Unable to load wallet summary."}
                  </p>
                  <Button className="mt-4" onClick={() => refetch()}>
                    Retry
                  </Button>
                </div>
              ) : data ? (
                <div className="space-y-4">
                  <section className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 border-b border-border/70 pb-2">
                      <User className="h-4 w-4 text-primary" aria-hidden />
                      <h3 className="text-sm font-bold text-foreground">
                        User Information
                      </h3>
                    </div>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
                        {(data.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {data.name}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <WalletBadge type="role" value={data.role} />
                          <WalletBadge type="status" value={data.status} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex items-start gap-2">
                        <Mail className="mt-0.5 h-3.5 w-3.5 text-muted" />
                        <Field label="Email" value={data.email} />
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="mt-0.5 h-3.5 w-3.5 text-muted" />
                        <Field label="Phone" value={data.mobile} />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 border-b border-border/70 pb-2">
                      <Wallet className="h-4 w-4 text-primary" aria-hidden />
                      <h3 className="text-sm font-bold text-foreground">
                        Wallet Summary
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field
                        label="Main Wallet"
                        value={formatCurrency(data.mainWallet)}
                      />
                      <Field
                        label="Commission Wallet"
                        value={formatCurrency(data.commissionWallet)}
                      />
                      <Field
                        label="Total Commission Earned"
                        value={formatCurrency(data.totalCommissionEarned)}
                      />
                      <Field
                        label="Last Wallet Updated"
                        value={formatDate(
                          data.lastWalletUpdated,
                          "dd MMM yyyy, HH:mm"
                        )}
                      />
                      <Field label="Currency" value={data.currency || "INR"} />
                    </div>
                  </section>

                  <section className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 border-b border-border/70 pb-2">
                      <Activity className="h-4 w-4 text-primary" aria-hidden />
                      <h3 className="text-sm font-bold text-foreground">
                        Wallet Statistics
                      </h3>
                    </div>
                    <WalletSummaryCards summary={data} />
                  </section>

                  <section className="rounded-2xl border border-dashed border-border bg-muted/10 p-4">
                    <h3 className="text-sm font-bold text-foreground">
                      Recent Activity
                    </h3>
                    <p className="mt-2 text-sm text-muted">
                      Placeholder — future ready for ledger / transaction
                      timeline.
                    </p>
                  </section>
                </div>
              ) : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
