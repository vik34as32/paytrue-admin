"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SortingState } from "@tanstack/react-table";
import { Plus, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { Input } from "@/components/common/Input";
import { WalletLienStatsCards } from "@/components/wallet-lien/WalletLienStatsCards";
import { WalletLienTable } from "@/components/wallet-lien/WalletLienTable";
import { ApplyWalletLienModal } from "@/components/wallet-lien/ApplyWalletLienModal";
import { ReleaseWalletLienModal } from "@/components/wallet-lien/ReleaseWalletLienModal";
import { ConfirmWalletLienDialog } from "@/components/wallet-lien/ConfirmWalletLienDialog";
import {
  useWalletLienMutations,
  useWalletLiens,
} from "@/hooks/useWalletLien";
import { WalletLienApiError } from "@/services/walletLien.service";
import { ROUTES } from "@/constants";
import { WalletLienListParams, WalletLienRecord } from "@/types/walletLien";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "PARTIALLY_RELEASED", label: "Partially Released" },
  { value: "RELEASED", label: "Released" },
];

export function WalletLienManagementView() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [applyOpen, setApplyOpen] = useState(false);
  const [releaseLien, setReleaseLien] = useState<WalletLienRecord | null>(null);
  const [confirmApply, setConfirmApply] = useState<null | {
    userId: string;
    amount: number;
    reason: string;
    remarks?: string;
  }>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPageIndex(0);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const params = useMemo<WalletLienListParams>(
    () => ({
      page: pageIndex + 1,
      limit: pageSize,
      search: search || undefined,
      status: status || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      sortBy: sorting[0]?.id || "createdAt",
      sortOrder: sorting[0]?.desc === false ? "asc" : "desc",
    }),
    [pageIndex, pageSize, search, status, fromDate, toDate, sorting]
  );

  const query = useWalletLiens(params);
  const { applyMutation, releaseMutation } = useWalletLienMutations();

  useEffect(() => {
    if (!query.isError || !query.error) return;
    const err = query.error;
    const statusCode =
      err instanceof WalletLienApiError ? err.status : undefined;
    const message = err instanceof Error ? err.message : "";
    if (
      statusCode === 403 ||
      /permission|forbidden|403/i.test(message)
    ) {
      router.replace(ROUTES.unauthorized);
    }
  }, [query.isError, query.error, router]);

  const handleApply = useCallback(
    async (values: {
      userId: string;
      amount: number;
      reason: string;
      remarks?: string;
    }) => {
      setConfirmApply(values);
      return false;
    },
    []
  );

  const confirmApplyLien = async () => {
    if (!confirmApply) return;
    try {
      await applyMutation.mutateAsync({
        userId: confirmApply.userId,
        amount: confirmApply.amount,
        reason: confirmApply.reason,
        remarks: confirmApply.remarks,
      });
      setConfirmApply(null);
      setApplyOpen(false);
    } catch {
      // toast handled in mutation
    }
  };

  const stats = query.data?.stats ?? {
    totalActiveLiens: 0,
    totalReleasedLiens: 0,
    totalLienAmount: 0,
    totalAvailableBalanceUnderHold: 0,
  };

  return (
    <div className="page-container space-y-6">
      <PageHeader
        breadcrumb="Super Admin"
        title="Wallet Lien Management"
        subtitle="Apply, track, and release main wallet liens across the network."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              type="button"
              className="gap-2"
              onClick={() => setApplyOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Apply Lien
            </Button>
          </div>
        }
      />

      <WalletLienStatsCards
        stats={stats}
        loading={query.isLoading && !query.data}
      />

      <Card>
        <CardHeader
          title="Wallet Lien List"
          subtitle="Search, filter, and manage active holds"
        />

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPageIndex(0);
            }}
          />
          <Input
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPageIndex(0);
            }}
          />
          <Input
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPageIndex(0);
            }}
          />
        </div>

        {query.isError && !query.data ? (
          <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-6 text-center">
            <p className="text-sm text-accent-red">
              {query.error instanceof Error
                ? query.error.message
                : "Failed to load wallet liens"}
            </p>
            <Button className="mt-3" onClick={() => query.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <WalletLienTable
            rows={query.data?.items ?? []}
            isLoading={query.isLoading || query.isFetching}
            searchValue={searchInput}
            onSearch={setSearchInput}
            pageIndex={pageIndex}
            pageSize={pageSize}
            pageCount={Math.max(1, query.data?.totalPages ?? 1)}
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPageIndex(0);
            }}
            sorting={sorting}
            onSortingChange={setSorting}
            onView={(row) =>
              router.push(`${ROUTES.superAdminWalletLien}/${row.id}`)
            }
            onRelease={(row) => setReleaseLien(row)}
          />
        )}
      </Card>

      <ApplyWalletLienModal
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        isSubmitting={applyMutation.isPending}
        onSubmit={handleApply}
      />

      <ConfirmWalletLienDialog
        isOpen={!!confirmApply}
        title="Confirm Apply Lien"
        message={
          confirmApply
            ? `Apply a lien of the entered amount for the selected user? Reason: ${confirmApply.reason}`
            : ""
        }
        confirmLabel="Apply Lien"
        isLoading={applyMutation.isPending}
        onClose={() => setConfirmApply(null)}
        onConfirm={() => void confirmApplyLien()}
      />

      <ReleaseWalletLienModal
        isOpen={!!releaseLien}
        lien={releaseLien}
        isSubmitting={releaseMutation.isPending}
        onClose={() => setReleaseLien(null)}
        onSubmit={async (values) => {
          if (!releaseLien) return false;
          try {
            await releaseMutation.mutateAsync({
              lienId: releaseLien.id,
              amount: values.amount,
              remarks: values.remarks,
            });
            return true;
          } catch {
            return false;
          }
        }}
      />
    </div>
  );
}
