"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { ReportExportBar } from "@/components/tables/ReportExportBar";
import { WalletSummaryCards } from "@/components/wallet-management/WalletSummaryCards";
import { WalletToolbar } from "@/components/wallet-management/WalletToolbar";
import { WalletTable } from "@/components/wallet-management/WalletTable";
import { WalletEmptyState } from "@/components/wallet-management/WalletEmptyState";
import { WalletDetailsDrawer } from "@/components/wallet-management/WalletDetailsDrawer";
import { WalletTransferActionModal } from "@/components/wallet-management/WalletTransferActionModal";
import { WalletDeductActionModal } from "@/components/wallet-management/WalletDeductActionModal";
import { WalletLienActionModal } from "@/components/wallet-management/WalletLienActionModal";
import { WalletFreezeActionModal } from "@/components/wallet-management/WalletFreezeActionModal";
import { WalletRowAction } from "@/components/wallet-management/WalletActionButtons";
import { WalletLoadingSkeleton } from "@/components/wallet-management/WalletLoadingSkeleton";
import { useWalletUsers, walletKeys } from "@/hooks/useWalletUsers";
import { WalletFilterValues } from "@/schemas/wallet-filter.schema";
import {
  WalletActionAmountFormValues,
  WalletLienActionFormValues,
} from "@/schemas/wallet-action.schema";
import {
  deductWalletBalance,
  freezeWallet,
  holdWalletBalance,
  releaseWalletHold,
  transferWalletBalance,
  unfreezeWallet,
  fetchWalletUsers,
} from "@/services/wallet.service";
import {
  WalletSortBy,
  WalletSortOrder,
  WalletUser,
  WalletUsersListParams,
} from "@/types/wallet";
import {
  downloadReportExcel,
  downloadReportPdf,
  reportFilename,
} from "@/lib/reportExport";
import { useQueryClient } from "@tanstack/react-query";

const DEFAULT_FILTERS: WalletFilterValues = {
  search: "",
  role: "",
  status: "",
  verificationStatus: "",
  limit: 20,
  page: 1,
  sortBy: "createdAt",
  sortOrder: "desc",
};

type ActionModal = "transfer" | "deduct" | "lien" | "freeze" | null;

interface WalletManagementViewProps {
  breadcrumb?: string;
}

export function WalletManagementView({
  breadcrumb = "Admin",
}: WalletManagementViewProps) {
  const queryClient = useQueryClient();
  const form = useForm<WalletFilterValues>({
    defaultValues: DEFAULT_FILTERS,
  });

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionUser, setActionUser] = useState<WalletUser | null>(null);
  const [actionModal, setActionModal] = useState<ActionModal>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const watched = form.watch();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      form.setValue("page", 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, form]);

  useEffect(() => {
    form.setValue("page", 1);
  }, [
    watched.role,
    watched.status,
    watched.verificationStatus,
    watched.limit,
    form,
  ]);

  const queryParams = useMemo<WalletUsersListParams>(
    () => ({
      page: watched.page,
      limit: watched.limit,
      search: debouncedSearch || undefined,
      role: watched.role || undefined,
      status: watched.status || undefined,
      verificationStatus: watched.verificationStatus || undefined,
      sortBy: watched.sortBy,
      sortOrder: watched.sortOrder,
    }),
    [
      watched.page,
      watched.limit,
      watched.role,
      watched.status,
      watched.verificationStatus,
      watched.sortBy,
      watched.sortOrder,
      debouncedSearch,
    ]
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useWalletUsers(queryParams);

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message || "Failed to load wallets");
    }
  }, [isError, error]);

  const items = data?.items ?? [];
  const summary = data?.summary ?? {
    totalUsers: 0,
    totalMainWalletBalance: 0,
    totalCommissionWalletBalance: 0,
    totalAepsWalletBalance: 0,
    totalHoldBalance: 0,
    totalAvailableBalance: 0,
    totalBalance: 0,
  };
  const pagination = data?.pagination ?? {
    total: 0,
    page: watched.page,
    limit: watched.limit,
    totalPages: 1,
  };

  const invalidateWallets = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: walletKeys.all });
  }, [queryClient]);

  const closeActionModal = useCallback(() => {
    setActionModal(null);
    setActionUser(null);
  }, []);

  const handleReset = useCallback(() => {
    setSearchInput("");
    setDebouncedSearch("");
    form.reset(DEFAULT_FILTERS);
  }, [form]);

  const handleSortChange = useCallback(
    (sortBy: WalletSortBy, sortOrder: WalletSortOrder) => {
      form.setValue("sortBy", sortBy);
      form.setValue("sortOrder", sortOrder);
      form.setValue("page", 1);
    },
    [form]
  );

  const handleAction = useCallback(
    (action: WalletRowAction, user: WalletUser) => {
      if (action === "view") {
        setSelectedUserId(user.userId);
        setDrawerOpen(true);
        return;
      }
      setActionUser(user);
      setActionModal(action);
    },
    []
  );

  const handleTransfer = useCallback(
    async (values: WalletActionAmountFormValues) => {
      if (!actionUser) return;
      setIsSubmitting(true);
      try {
        await transferWalletBalance({
          receiverId: actionUser.userId,
          amount: values.amount,
          description: values.description,
        });
        toast.success("Balance transferred successfully");
        closeActionModal();
        await invalidateWallets();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Transfer failed"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [actionUser, closeActionModal, invalidateWallets]
  );

  const handleDeduct = useCallback(
    async (values: WalletActionAmountFormValues) => {
      if (!actionUser) return;
      setIsSubmitting(true);
      try {
        await deductWalletBalance({
          userId: actionUser.userId,
          amount: values.amount,
          description: values.description,
        });
        toast.success("Balance deducted successfully");
        closeActionModal();
        await invalidateWallets();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Deduct failed");
      } finally {
        setIsSubmitting(false);
      }
    },
    [actionUser, closeActionModal, invalidateWallets]
  );

  const handleLien = useCallback(
    async (values: WalletLienActionFormValues) => {
      if (!actionUser) return;
      setIsSubmitting(true);
      try {
        if (values.mode === "release") {
          await releaseWalletHold({
            userId: actionUser.userId,
            amount: values.amount,
            description: values.description,
          });
          toast.success("Hold amount released successfully");
        } else {
          await holdWalletBalance({
            userId: actionUser.userId,
            amount: values.amount,
            description: values.description,
          });
          toast.success("Lien / hold applied successfully");
        }
        closeActionModal();
        await invalidateWallets();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Lien action failed"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [actionUser, closeActionModal, invalidateWallets]
  );

  const handleFreeze = useCallback(async () => {
    if (!actionUser) return;
    const isFrozen =
      String(
        actionUser.walletStatus || actionUser.wallet?.status || ""
      ).toUpperCase() === "FROZEN";
    setIsSubmitting(true);
    try {
      if (isFrozen) {
        await unfreezeWallet(actionUser.userId);
        toast.success("Wallet unfrozen successfully");
      } else {
        await freezeWallet(actionUser.userId);
        toast.success("Wallet frozen successfully");
      }
      closeActionModal();
      await invalidateWallets();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Freeze action failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [actionUser, closeActionModal, invalidateWallets]);

  const toWalletExportRows = (users: WalletUser[]) =>
    users.map((user, index) => ({
      "#": index + 1,
      "User Code": user.userCode || "",
      Name: user.name || "",
      Mobile: user.mobile || "",
      Email: user.email || "",
      Role: user.role || "",
      Status: user.status || "",
      Verification: user.verificationStatus || "",
      "Main Wallet": user.mainWallet ?? 0,
      "Commission Wallet": user.commissionWallet ?? 0,
      "AEPS Wallet": user.aepsWallet ?? 0,
      "Hold Balance": user.holdBalance ?? 0,
      "Available Balance": user.availableBalance ?? 0,
      "Total Balance": user.totalBalance ?? 0,
    }));

  const fetchAllWalletUsers = async () => {
    const base: WalletUsersListParams = {
      ...queryParams,
      page: 1,
      limit: 100,
    };
    const first = await fetchWalletUsers(base);
    const all = [...first.items];
    const totalPages = Math.max(1, first.pagination.totalPages || 1);
    for (let page = 2; page <= totalPages; page += 1) {
      const next = await fetchWalletUsers({
        ...base,
        page,
        limit: first.pagination.limit || 100,
      });
      all.push(...next.items);
    }
    return all;
  };

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      const users = await fetchAllWalletUsers();
      if (!users.length) {
        toast.error("No records available to export");
        return;
      }
      downloadReportExcel(
        toWalletExportRows(users),
        reportFilename("wallet-management"),
        "Wallet Management"
      );
      toast.success(`Excel downloaded (${users.length} records)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExportLoading(true);
      const users = await fetchAllWalletUsers();
      if (!users.length) {
        toast.error("No records available to export");
        return;
      }
      const exportRows = toWalletExportRows(users);
      downloadReportPdf({
        title: "Wallet Management",
        subtitle: "User wallet balances report",
        filename: reportFilename("wallet-management"),
        columns: Object.keys(exportRows[0] || {}).map((key) => ({
          key,
          label: key,
        })),
        rows: exportRows,
      });
      toast.success("PDF print dialog opened");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PDF export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const showInitialSkeleton = isLoading && !data;
  const showEmpty =
    !isLoading && !isError && items.length === 0 && !isFetching;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={breadcrumb}
        title="Wallet Management"
        subtitle="Manage and monitor all user wallets."
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Refresh
          </Button>
        }
      />

      {showInitialSkeleton ? (
        <WalletLoadingSkeleton />
      ) : (
        <>
          <WalletSummaryCards
            summary={summary}
            isLoading={isFetching && !data}
          />

          <WalletToolbar
            form={form}
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            onRefresh={() => refetch()}
            onReset={handleReset}
            isFetching={isFetching}
          />

          {isError && !data ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
              <p className="text-sm text-muted">
                {error?.message || "Unable to load wallet users."}
              </p>
              <Button className="mt-4" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : showEmpty ? (
            <WalletEmptyState onReset={handleReset} />
          ) : (
            <div className="space-y-3">
              <ReportExportBar
                loading={exportLoading || isFetching}
                onExportExcel={() => void handleExportExcel()}
                onExportPdf={() => void handleExportPdf()}
              />
              <WalletTable
                rows={items}
                isLoading={isLoading}
                isFetching={isFetching}
                sortBy={watched.sortBy}
                sortOrder={watched.sortOrder}
                onSortChange={handleSortChange}
                onAction={handleAction}
                page={pagination.page || watched.page}
                limit={pagination.limit || watched.limit}
                total={pagination.total}
                totalPages={pagination.totalPages}
                onPageChange={(page) => form.setValue("page", page)}
                onPageSizeChange={(limit) => {
                  form.setValue("limit", limit);
                  form.setValue("page", 1);
                }}
                pageSizeOptions={[10, 20, 50, 100]}
              />
            </div>
          )}
        </>
      )}

      <WalletDetailsDrawer
        open={drawerOpen}
        userId={selectedUserId}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedUserId(null);
        }}
      />

      <WalletTransferActionModal
        open={actionModal === "transfer"}
        user={actionUser}
        isSubmitting={isSubmitting}
        onClose={closeActionModal}
        onSubmit={handleTransfer}
      />

      <WalletDeductActionModal
        open={actionModal === "deduct"}
        user={actionUser}
        isSubmitting={isSubmitting}
        onClose={closeActionModal}
        onSubmit={handleDeduct}
      />

      <WalletLienActionModal
        open={actionModal === "lien"}
        user={actionUser}
        isSubmitting={isSubmitting}
        onClose={closeActionModal}
        onSubmit={handleLien}
      />

      <WalletFreezeActionModal
        open={actionModal === "freeze"}
        user={actionUser}
        isSubmitting={isSubmitting}
        onClose={closeActionModal}
        onConfirm={handleFreeze}
      />
    </div>
  );
}
