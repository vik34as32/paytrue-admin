"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Download,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { DataTable } from "@/components/tables/DataTable";
import { ReportExportBar } from "@/components/tables/ReportExportBar";
import { ReportStatsRow } from "@/components/tables/ReportStatsRow";
import {
  NetworkUserCrudModals,
  useNetworkUserTableColumns,
} from "@/components/super-admin/NetworkUserCrudModals";
import { useVerificationWorkflow } from "@/hooks/useVerificationWorkflow";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import {
  listAllSuperAdminNetworkUsers,
  listSuperAdminNetworkUsers,
  SuperAdminNetworkKind,
} from "@/services/superAdminApi";
import { ListQueryParams, NetworkUserRecord } from "@/types/superAdmin";
import { getUserVerificationStatus } from "@/lib/idVerification";
import { IdVerificationStatus } from "@/types/idVerification";
import { filterVisibleNetworkUsers } from "@/lib/normalizeUser";
import {
  ADMIN_NETWORK_USER_KIND_LABEL,
  exportNetworkUsersToCsv,
  exportNetworkUsersToExcel,
  openNetworkUsersStatement,
} from "@/lib/networkUserExport";
import { ROUTES } from "@/constants";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const VERIFICATION_FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

const KIND_META: Record<
  SuperAdminNetworkKind,
  { title: string; breadcrumb: string; searchPlaceholder: string }
> = {
  MASTER_DISTRIBUTOR: {
    title: "Master Distributors",
    breadcrumb: "Dashboard / Users / Master Distributors",
    searchPlaceholder:
      "Search name, email, phone, Aadhaar, PAN, user code, business...",
  },
  DISTRIBUTOR: {
    title: "Distributors",
    breadcrumb: "Dashboard / Users / Distributors",
    searchPlaceholder:
      "Search name, email, phone, Aadhaar, PAN, user code, business...",
  },
  RETAILER: {
    title: "Retailers",
    breadcrumb: "Dashboard / Users / Retailers",
    searchPlaceholder:
      "Search name, email, phone, Aadhaar, PAN, user code, business...",
  },
};

interface SuperAdminNetworkUsersViewProps {
  kind: SuperAdminNetworkKind;
}

function parseSortBy(value: string | null): string {
  if (value === "name" || value === "email" || value === "phone" || value === "createdAt") {
    return value;
  }
  return "createdAt";
}

export function SuperAdminNetworkUsersView({
  kind,
}: SuperAdminNetworkUsersViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const meta = KIND_META[kind];

  const [data, setData] = useState<NetworkUserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [fromDate, setFromDate] = useState(
    searchParams.get("fromDate") || searchParams.get("startDate") || ""
  );
  const [toDate, setToDate] = useState(
    searchParams.get("toDate") || searchParams.get("endDate") || ""
  );
  const [pageIndex, setPageIndex] = useState(
    Math.max(0, Number(searchParams.get("page") || "1") - 1)
  );
  const [pageSize, setPageSize] = useState(
    PAGE_SIZE_OPTIONS.includes(Number(searchParams.get("pageSize")))
      ? Number(searchParams.get("pageSize"))
      : 10
  );
  const [sortBy, setSortBy] = useState(parseSortBy(searchParams.get("sortBy")));
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    searchParams.get("sortOrder") === "asc" ? "asc" : "desc"
  );
  const [verificationStatus, setVerificationStatus] = useState(
    searchParams.get("verificationStatus") || ""
  );

  // Debounce search 500ms + keep in URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim();
      setSearch((prev) => {
        if (prev !== next) setPageIndex(0);
        return next;
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams = useMemo<Omit<ListQueryParams, "page" | "pageSize">>(
    () => ({
      search: search || undefined,
      sortBy,
      sortOrder,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      startDate: fromDate || undefined,
      endDate: toDate || undefined,
    }),
    [search, sortBy, sortOrder, fromDate, toDate]
  );

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);
    if (verificationStatus) params.set("verificationStatus", verificationStatus);
    params.set("page", String(pageIndex + 1));
    params.set("pageSize", String(pageSize));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [
    search,
    fromDate,
    toDate,
    sortBy,
    sortOrder,
    verificationStatus,
    pageIndex,
    pageSize,
    pathname,
    router,
  ]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listSuperAdminNetworkUsers(kind, {
        ...queryParams,
        page: pageIndex + 1,
        pageSize,
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
  }, [kind, queryParams, pageIndex, pageSize]);

  const enableVerification =
    kind === "RETAILER" || kind === "MASTER_DISTRIBUTOR";

  const verification = useVerificationWorkflow(() => {
    void loadData();
  });

  const { columns, crud } = useNetworkUserTableColumns(
    () => {
      void loadData();
    },
    {
      pageIndex,
      pageSize,
      userKind: kind,
      enableVerification,
      verification: enableVerification
        ? {
            onVerify: verification.openVerify,
            onReject: verification.openReject,
            onViewVerification: verification.openDetails,
            onViewRejectReason: verification.openReason,
            onTransfer: verification.openTransfer,
            onDeduct: verification.openDeduct,
            disabled: verification.isBusy,
          }
        : undefined,
    }
  );

  const tableData = useMemo(() => {
    let rows = data;
    if (verificationStatus) {
      rows = rows.filter(
        (user) =>
          getUserVerificationStatus(user) ===
          (verificationStatus as IdVerificationStatus)
      );
    }
    return rows;
  }, [data, verificationStatus]);

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
      return;
    }
    void loadData();
  }, [hasSuperAdminWalletAccess, router, loadData]);

  const sorting: SortingState = useMemo(() => {
    const id =
      sortBy === "phone" ? "phone" : sortBy === "mobile" ? "phone" : sortBy;
    return [{ id, desc: sortOrder === "desc" }];
  }, [sortBy, sortOrder]);

  const onSortingChange = (
    updater: SortingState | ((old: SortingState) => SortingState)
  ) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    if (!next.length) {
      setSortBy("createdAt");
      setSortOrder("desc");
      setPageIndex(0);
      return;
    }
    const column = next[0];
    const mapped =
      column.id === "phone" || column.id === "mobile"
        ? "phone"
        : column.id === "name" ||
            column.id === "email" ||
            column.id === "createdAt"
          ? column.id
          : "createdAt";
    setSortBy(mapped);
    setSortOrder(column.desc ? "desc" : "asc");
    setPageIndex(0);
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setFromDate("");
    setToDate("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPageIndex(0);
    setPageSize(10);
  };

  const buildFilename = () => {
    const slug = ADMIN_NETWORK_USER_KIND_LABEL[kind]
      .toLowerCase()
      .replace(/\s+/g, "-");
    return `paytrue-${slug}-${new Date().toISOString().slice(0, 10)}`;
  };

  const loadExportUsers = async () => {
    const raw = await listAllSuperAdminNetworkUsers(kind, queryParams);
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
        kind,
        filename: buildFilename(),
        filters: {
          search,
          startDate: fromDate,
          endDate: toDate,
        },
      });
      toast.success(`Excel downloaded (${users.length} records)`);
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
        kind,
        search,
        startDate: fromDate,
        endDate: toDate,
      });
      if (result.mode === "download") {
        toast.success(
          "Pop-up blocked — statement HTML downloaded. Open it and Print → Save as PDF."
        );
        return;
      }
      toast.success(
        mode === "pdf"
          ? `PDF view opened (${users.length} records)`
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

  if (!hasSuperAdminWalletAccess) return null;

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

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
    return { pending, verified, rejected, total: data.length };
  }, [data]);

  const summaryCards = useMemo(
    () => [
      {
        label: `Total ${ADMIN_NETWORK_USER_KIND_LABEL[kind]}s`,
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
    [kind, total, verificationStats]
  );

  return (
    <div className="page-container space-y-5">
      <PageHeader
        breadcrumb={meta.breadcrumb}
        title={meta.title}
        subtitle={`Manage ${ADMIN_NETWORK_USER_KIND_LABEL[kind].toLowerCase()}s · Total Records: ${total}`}
      />

      {enableVerification ? (
        <ReportStatsRow items={summaryCards} />
      ) : null}

      {error ? (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      ) : null}

      <Card className="space-y-4 border-[#E2E8F0] p-4 shadow-sm dark:border-border sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="md:col-span-2 xl:col-span-2">
            <Input
              label="Search"
              placeholder={meta.searchPlaceholder}
              icon={<Search className="h-4 w-4" />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
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
          <Select
            label="Verification Status"
            value={verificationStatus}
            onChange={(e) => {
              setVerificationStatus(e.target.value);
              setPageIndex(0);
            }}
            options={VERIFICATION_FILTER_OPTIONS}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => void loadData()}
            disabled={isLoading || exportLoading}
          >
            <Search className="h-4 w-4" />
            Search
          </Button>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadData()}
            disabled={isLoading || exportLoading}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 border-[#E2E8F0] p-4 shadow-sm dark:border-border sm:p-5">
        <ReportExportBar
          loading={exportLoading}
          onExportExcel={() => void handleExportExcel()}
          onExportPdf={() => void handlePrintOrPdf("pdf")}
          left={
            <p className="text-sm text-[#64748B]">
              Total Records:{" "}
              <span className="font-semibold text-[#0F172A] dark:text-foreground">
                {total}
              </span>
            </p>
          }
        />

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={exportLoading}
            onClick={() => void handleExportCsv()}
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={exportLoading}
            onClick={() => void handlePrintOrPdf("print")}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>

        <DataTable
          data={tableData}
          columns={columns}
          isLoading={isLoading}
          hideSearch
          tone="report"
          stickyHeader
          manualPagination
          pageCount={pageCount}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          totalRows={total}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageIndex(0);
          }}
          manualSorting
          sorting={sorting}
          onSortingChange={onSortingChange}
          minTableWidth={1480}
        />
      </Card>

      <NetworkUserCrudModals crud={crud} />
      {enableVerification ? verification.dialogs : null}
    </div>
  );
}
