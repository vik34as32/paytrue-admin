"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { WalletStatsCards } from "@/components/wallets/WalletStatsCards";
import { WalletFilterBar } from "@/components/wallets/WalletFilterBar";
import { WalletTable } from "@/components/wallets/WalletTable";
import { WalletDrawer } from "@/components/wallets/WalletDrawer";
import { WalletEmptyState } from "@/components/wallets/WalletEmptyState";
import {
  WalletSkeleton,
  WalletSelfSkeleton,
} from "@/components/wallets/WalletSkeleton";
import { WalletSummaryCards } from "@/components/wallets/WalletSummaryCards";
import { WalletBadge } from "@/components/wallets/WalletBadge";
import { useWalletBalances } from "@/hooks/useWalletBalances";
import { useWalletSummary } from "@/hooks/useWalletSummary";
import { useRoleAccess } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import { UserRole } from "@/types";
import { WalletBalancesQuery } from "@/types/walletBalances";

const SELF_ONLY_ROLES: UserRole[] = [
  "master_distributor",
  "distributor",
  "retailer",
];

function toApiRole(role: UserRole | undefined): string | undefined {
  if (!role) return undefined;
  return role.toUpperCase();
}

interface WalletBalancesViewProps {
  breadcrumb?: string;
}

export function WalletBalancesView({
  breadcrumb = "Admin",
}: WalletBalancesViewProps) {
  const { user, isSuperAdmin, isAdminApiAuth } = useRoleAccess();
  const role = user?.role;
  const isSelfOnly =
    !!role && SELF_ONLY_ROLES.includes(role) && !isSuperAdmin && !isAdminApiAuth;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const listParams = useMemo<WalletBalancesQuery>(
    () => ({
      page,
      limit,
      search: search || undefined,
      role: (roleFilter || undefined) as WalletBalancesQuery["role"],
      status: (statusFilter || undefined) as WalletBalancesQuery["status"],
    }),
    [page, limit, search, roleFilter, statusFilter]
  );

  const listQuery = useWalletBalances(listParams, !isSelfOnly);
  const selfQuery = useWalletSummary(
    isSelfOnly ? user?.id || null : null,
    isSelfOnly
  );

  useEffect(() => {
    if (listQuery.isError && listQuery.error) {
      toast.error(listQuery.error.message || "Failed to load wallet balances");
    }
  }, [listQuery.isError, listQuery.error]);

  useEffect(() => {
    if (selfQuery.isError && selfQuery.error) {
      toast.error(selfQuery.error.message || "Failed to load wallet");
    }
  }, [selfQuery.isError, selfQuery.error]);

  const handleReset = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setLimit(20);
    setPage(1);
  }, []);

  const handleExport = useCallback(() => {
    toast.message("Export", {
      description: "Export is UI-only for now.",
    });
  }, []);

  const permissions = listQuery.data?.permissions;
  const canList =
    permissions?.canListUsers !== false &&
    permissions?.selfOnly !== true &&
    !isSelfOnly;

  // Self-only experience (MD / Distributor / Retailer)
  if (isSelfOnly) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumb={breadcrumb}
          title="My Wallet"
          subtitle="View your wallet balances and commission summary."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => selfQuery.refetch()}
              disabled={selfQuery.isFetching}
            >
              Refresh
            </Button>
          }
        />

        {selfQuery.isLoading ? (
          <WalletSelfSkeleton />
        ) : selfQuery.isError ? (
          <div
            role="alert"
            className="rounded-2xl border border-accent-red/30 bg-accent-red/5 p-6 text-center"
          >
            <p className="text-sm text-foreground">
              {selfQuery.error?.message || "Unable to load your wallet."}
            </p>
            <Button className="mt-4" onClick={() => selfQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : selfQuery.data ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  {selfQuery.data.name}
                </h2>
                <WalletBadge
                  type="role"
                  value={selfQuery.data.role || toApiRole(role) || ""}
                />
                <WalletBadge type="status" value={selfQuery.data.status} />
              </div>
              <p className="text-sm text-muted">
                Last updated{" "}
                {formatDate(
                  selfQuery.data.lastWalletUpdated,
                  "dd MMM yyyy, HH:mm"
                )}
              </p>
            </div>
            <WalletSummaryCards
              summary={selfQuery.data}
              className="sm:grid-cols-2 lg:grid-cols-4"
            />
          </motion.div>
        ) : (
          <WalletEmptyState variant="no-wallets" />
        )}
      </div>
    );
  }

  const items = listQuery.data?.items ?? [];
  const stats = listQuery.data?.stats ?? {
    totalWalletBalance: 0,
    totalCommissionWallet: 0,
    totalCommissionEarned: 0,
    usersCount: 0,
    activeUsers: 0,
  };
  const pagination = listQuery.data?.pagination ?? {
    total: 0,
    page,
    limit,
    totalPages: 1,
  };

  const showInitialSkeleton = listQuery.isLoading && !listQuery.data;
  const hasFilters = !!(search || roleFilter || statusFilter);
  const showEmpty =
    !listQuery.isLoading &&
    !listQuery.isError &&
    items.length === 0 &&
    canList;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={breadcrumb}
        title="Wallet Management"
        subtitle="Monitor wallet balances across your hierarchy."
      />

      {showInitialSkeleton ? (
        <WalletSkeleton />
      ) : (
        <>
          <WalletStatsCards
            stats={stats}
            isLoading={listQuery.isFetching && !listQuery.data}
          />

          <WalletFilterBar
            search={searchInput}
            onSearchChange={setSearchInput}
            role={roleFilter}
            onRoleChange={(v) => {
              setRoleFilter(v);
              setPage(1);
            }}
            status={statusFilter}
            onStatusChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            limit={limit}
            onLimitChange={(v) => {
              setLimit(v);
              setPage(1);
            }}
            onRefresh={() => listQuery.refetch()}
            onReset={handleReset}
            onExport={handleExport}
            isFetching={listQuery.isFetching}
          />

          {listQuery.isError && !listQuery.data ? (
            <div
              role="alert"
              className="rounded-2xl border border-accent-red/30 bg-accent-red/5 p-6 text-center"
            >
              <p className="text-sm text-foreground">
                {listQuery.error?.message ||
                  "Unable to load wallet balances."}
              </p>
              <Button className="mt-4" onClick={() => listQuery.refetch()}>
                Retry
              </Button>
            </div>
          ) : showEmpty ? (
            <WalletEmptyState
              variant={hasFilters ? "no-search" : "no-users"}
              onReset={handleReset}
            />
          ) : (
            <WalletTable
              rows={items}
              isLoading={listQuery.isLoading}
              isFetching={listQuery.isFetching}
              page={pagination.page || page}
              limit={pagination.limit || limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
              onViewWallet={(userId) => {
                setDrawerUserId(userId);
                setDrawerOpen(true);
              }}
            />
          )}
        </>
      )}

      <WalletDrawer
        open={drawerOpen}
        userId={drawerUserId}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerUserId(null);
        }}
      />
    </div>
  );
}
