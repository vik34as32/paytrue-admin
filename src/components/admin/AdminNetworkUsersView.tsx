"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import {
  AdminListFilters,
  AdminListFiltersValue,
} from "@/components/admin/AdminListFilters";
import {
  AdminUserCrudModals,
  useAdminUserTableColumns,
} from "@/components/admin/AdminUserCrudModals";
import { clearUserFormDraft } from "@/lib/userFormDraftStorage";
import {
  ADMIN_NETWORK_USER_KIND_LABEL,
  exportNetworkUsersToCsv,
  exportNetworkUsersToExcel,
  openNetworkUsersStatement,
} from "@/lib/networkUserExport";
import { getUserVerificationStatus } from "@/lib/idVerification";
import {
  AdminManagedUserRole,
  listAdminUsers,
  listAllAdminUsers,
  mapAdminListFiltersToUsersParams,
} from "@/services/adminUsersApi";
import { NetworkUserRecord } from "@/types/superAdmin";
import { IdVerificationStatus } from "@/types/idVerification";
import { filterVisibleNetworkUsers } from "@/lib/normalizeUser";
import { ReportExportBar } from "@/components/tables/ReportExportBar";
import { ReportStatsRow } from "@/components/tables/ReportStatsRow";
import { useVerificationWorkflow } from "@/hooks/useVerificationWorkflow";
import {
  Download,
  Printer,
  ShieldCheck,
  UserPlus,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";

const PAGE_SIZE = 10;

interface AdminNetworkUsersViewProps {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  userKind: AdminManagedUserRole;
  createHref?: string;
  createLabel?: string;
}

export function AdminNetworkUsersView({
  title,
  subtitle,
  searchPlaceholder,
  userKind,
  createHref,
  createLabel,
}: AdminNetworkUsersViewProps) {
  const [data, setData] = useState<NetworkUserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [filters, setFilters] = useState<AdminListFiltersValue>({
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPageIndex(0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const queryParams = useMemo(
    () =>
      mapAdminListFiltersToUsersParams(
        {
          search: debouncedSearch || undefined,
          status: filters.status,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
        userKind
      ),
    [debouncedSearch, filters, userKind]
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listAdminUsers({
        ...queryParams,
        page: pageIndex + 1,
        pageSize: PAGE_SIZE,
      });
      const { users, hiddenCount } = filterVisibleNetworkUsers(result.data);
      setData(users);
      setTotal(Math.max(0, (result.total ?? result.data.length) - hiddenCount));
    } catch (err) {
      setData([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [queryParams, pageIndex]);

  const enableVerification =
    userKind === "RETAILER" || userKind === "MASTER_DISTRIBUTOR";

  const verification = useVerificationWorkflow(() => {
    void loadData();
  });

  const { columns, crud } = useAdminUserTableColumns(
    userKind,
    () => {
      void loadData();
    },
    {
      pageIndex,
      pageSize: PAGE_SIZE,
      enableVerification,
      // Admin: no Edit/Delete (Super Admin only). No transfer/deduct in table actions.
      showEditDelete: false,
      verification: enableVerification
        ? {
            onVerify: verification.openVerify,
            onReject: verification.openReject,
            onViewVerification: verification.openDetails,
            onViewRejectReason: verification.openReason,
            disabled: verification.isBusy,
          }
        : undefined,
    }
  );

  const tableData = useMemo(() => {
    const status = filters.verificationStatus as IdVerificationStatus | undefined;
    if (!status) return data;
    return data.filter((user) => getUserVerificationStatus(user) === status);
  }, [data, filters.verificationStatus]);

  const verificationStats = useMemo(() => {
    let pending = 0;
    let verified = 0;
    let rejected = 0;
    for (const user of data) {
      const status = getUserVerificationStatus(user);
      if (status === "PENDING") pending += 1;
      else if (status === "VERIFIED") verified += 1;
      else if (status === "REJECTED") rejected += 1;
    }
    return { pending, verified, rejected };
  }, [data]);

  const summaryCards = useMemo(
    () => [
      {
        label: `Total ${ADMIN_NETWORK_USER_KIND_LABEL[userKind]}s`,
        value: String(total),
        hint: "All Time",
        icon: Users,
        iconClassName: "bg-[#4318FF]/10 text-[#4318FF]",
      },
      {
        label: "Verified",
        value: String(verificationStats.verified),
        hint: "This page",
        icon: UserCheck,
        iconClassName: "bg-emerald-500/10 text-emerald-600",
      },
      {
        label: "Pending",
        value: String(verificationStats.pending),
        hint: "This page",
        icon: ShieldCheck,
        iconClassName: "bg-amber-500/10 text-amber-600",
      },
      {
        label: "Rejected",
        value: String(verificationStats.rejected),
        hint: "This page",
        icon: UserX,
        iconClassName: "bg-rose-500/10 text-rose-600",
      },
    ],
    [userKind, total, verificationStats]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const buildFilename = () => {
    const slug = ADMIN_NETWORK_USER_KIND_LABEL[userKind]
      .toLowerCase()
      .replace(/\s+/g, "-");
    return `paytrue-${slug}-${new Date().toISOString().slice(0, 10)}`;
  };

  const loadExportUsers = async () => {
    const raw = await listAllAdminUsers(queryParams);
    const { users } = filterVisibleNetworkUsers(raw);
    if (!users.length) {
      toast.error("No records available to export");
      return null;
    }
    return users;
  };

  const handleExportCsv = async () => {
    try {
      setExportLoading(true);
      const users = await loadExportUsers();
      if (!users) return;
      exportNetworkUsersToCsv(users, buildFilename());
      toast.success(`CSV downloaded (${users.length} records)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "CSV export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      const users = await loadExportUsers();
      if (!users) return;
      await exportNetworkUsersToExcel({
        users,
        kind: userKind,
        filename: buildFilename(),
        filters: {
          search: queryParams.search,
          status: queryParams.status,
          startDate: queryParams.fromDate,
          endDate: queryParams.toDate,
        },
      });
      toast.success(
        `Excel downloaded with PayTrue branding (${users.length} records)`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Excel export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const handlePrintOrPdf = async (mode: "print" | "pdf") => {
    try {
      setExportLoading(true);
      const users = await loadExportUsers();
      if (!users) return;
      const result = openNetworkUsersStatement({
        users,
        kind: userKind,
        search: queryParams.search,
        status: queryParams.status,
        startDate: queryParams.fromDate,
        endDate: queryParams.toDate,
      });
      if (result.mode === "download") {
        toast.success(
          "Pop-up blocked — statement HTML downloaded. Open it and use Print → Save as PDF."
        );
        return;
      }
      toast.success(
        mode === "pdf"
          ? `PDF view opened (${users.length} records) — Print → Save as PDF`
          : `Print dialog opened (${users.length} records)`
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to open print/PDF view"
      );
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="page-container space-y-5">
      <PageHeader
        breadcrumb="Admin"
        title={title}
        subtitle={subtitle}
        action={
          createHref && createLabel ? (
            <Link
              href={createHref}
              onClick={() => clearUserFormDraft(userKind)}
            >
              <Button>
                <UserPlus className="h-4 w-4" />
                {createLabel}
              </Button>
            </Link>
          ) : null
        }
      />

      {enableVerification ? <ReportStatsRow items={summaryCards} /> : null}

      {error ? (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      ) : null}

      <Card className="overflow-hidden border-[#D0D5DD] p-0 shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:border-border">
        <div className="border-b border-[#E2E8F0] bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 px-4 py-4 dark:border-border dark:from-card dark:via-card dark:to-card sm:px-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold tracking-wide text-slate-800 dark:text-foreground">
                {ADMIN_NETWORK_USER_KIND_LABEL[userKind]} Directory
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Search, filter by date range, and export records
              </p>
            </div>
            <ReportExportBar
              loading={exportLoading || isLoading}
              onExportExcel={() => void handleExportExcel()}
              onExportPdf={() => void handlePrintOrPdf("pdf")}
              left={
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exportLoading || isLoading}
                    onClick={() => void handleExportCsv()}
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exportLoading || isLoading}
                    onClick={() => void handlePrintOrPdf("print")}
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                </div>
              }
            />
          </div>

          <AdminListFilters
            value={filters}
            onChange={(next) => {
              setFilters(next);
              setPageIndex(0);
            }}
            showSort
            showDateRange
            showVerificationStatus={enableVerification}
          />
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <DataTable
            data={tableData}
            columns={columns}
            isLoading={isLoading}
            searchPlaceholder={searchPlaceholder}
            searchValue={searchInput}
            onSearch={setSearchInput}
            manualPagination
            pageCount={Math.max(1, Math.ceil((total || 0) / PAGE_SIZE))}
            pageIndex={pageIndex}
            onPageChange={setPageIndex}
            pageSize={PAGE_SIZE}
            totalRows={total}
            tone="report"
            stickyHeader
            minTableWidth={1480}
          />
        </div>
      </Card>

      <AdminUserCrudModals crud={crud} />
      {enableVerification ? verification.dialogs : null}
    </div>
  );
}
