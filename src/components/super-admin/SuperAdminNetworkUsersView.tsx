"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  ArrowDownUp,
  Download,
  Filter,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Users,
  UserCheck,
  UserPlus,
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
import {
  ListQueryParams,
  NetworkUserRecord,
  UserDetailRecord,
} from "@/types/superAdmin";
import { getUserVerificationStatus } from "@/lib/idVerification";
import {
  filterVisibleNetworkUsers,
  getHierarchyLabel,
  getNetworkUserName,
} from "@/lib/normalizeUser";
import {
  ADMIN_NETWORK_USER_KIND_LABEL,
  exportNetworkUsersToCsv,
  exportNetworkUsersToExcel,
  openNetworkUsersStatement,
} from "@/lib/networkUserExport";
import { ROUTES } from "@/constants";
import { CreateRetailerModal } from "@/components/forms/CreateRetailerModal";
import { CreateDistributorModal } from "@/components/forms/CreateDistributorModal";
import { clearUserFormDraft } from "@/lib/userFormDraftStorage";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const VERIFICATION_FILTER_OPTIONS = [
  { value: "", label: "All verification" },
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All status" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "PENDING", label: "Pending" },
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Created date" },
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
];

const KIND_META: Record<
  SuperAdminNetworkKind,
  { title: string; breadcrumb: string; searchPlaceholder: string; accent: string }
> = {
  MASTER_DISTRIBUTOR: {
    title: "Master Distributors",
    breadcrumb: "Network · Master Distributors",
    searchPlaceholder: "Search name, email, phone, code, business…",
    accent: "from-violet-600 to-indigo-600",
  },
  DISTRIBUTOR: {
    title: "Distributors",
    breadcrumb: "Network · Distributors",
    searchPlaceholder: "Search name, email, phone, code, master distributor…",
    accent: "from-sky-600 to-cyan-600",
  },
  RETAILER: {
    title: "Retailers",
    breadcrumb: "Network · Retailers",
    searchPlaceholder:
      "Search name, email, phone, code, distributor, master distributor…",
    accent: "from-blue-600 to-indigo-600",
  },
};

interface SuperAdminNetworkUsersViewProps {
  kind: SuperAdminNetworkKind;
}

function matchesHierarchySearch(user: NetworkUserRecord, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const labels = getHierarchyLabel(user as UserDetailRecord);
  const haystack = [
    getNetworkUserName(user),
    user.email,
    user.mobile,
    user.phone,
    user.userCode,
    user.businessName,
    user.outletName,
    labels.masterDistributor,
    labels.distributor,
    labels.parentUser,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function SuperAdminNetworkUsersView({
  kind,
}: SuperAdminNetworkUsersViewProps) {
  const router = useRouter();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const meta = KIND_META[kind];

  const [data, setData] = useState<NetworkUserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [createRetailerOpen, setCreateRetailerOpen] = useState(false);
  const [createDistributorOpen, setCreateDistributorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [masterDistributorId, setMasterDistributorId] = useState("");
  const [distributorId, setDistributorId] = useState("");
  const [mdOptions, setMdOptions] = useState<{ value: string; label: string }[]>(
    [{ value: "", label: "All master distributors" }]
  );
  const [distOptions, setDistOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "", label: "All distributors" }]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim();
      setSearch((prev) => {
        if (prev !== next) setPageIndex(0);
        return next;
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams = useMemo<Omit<ListQueryParams, "page" | "pageSize">>(
    () => ({
      search: search || undefined,
      sortBy,
      sortOrder,
      status: status || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      startDate: fromDate || undefined,
      endDate: toDate || undefined,
      masterDistributorId: masterDistributorId || undefined,
      distributorId: distributorId || undefined,
      parentId: distributorId || undefined,
    }),
    [
      search,
      sortBy,
      sortOrder,
      status,
      fromDate,
      toDate,
      masterDistributorId,
      distributorId,
    ]
  );

  const loadHierarchyFilters = useCallback(async () => {
    if (kind === "MASTER_DISTRIBUTOR") return;
    try {
      const mds = await listAllSuperAdminNetworkUsers("MASTER_DISTRIBUTOR", {});
      const { users } = filterVisibleNetworkUsers(mds);
      setMdOptions([
        { value: "", label: "All master distributors" },
        ...users.map((user) => ({
          value: user.id,
          label:
            `${getNetworkUserName(user)}${
              user.userCode ? ` · ${user.userCode}` : ""
            }`.trim(),
        })),
      ]);
    } catch {
      setMdOptions([{ value: "", label: "All master distributors" }]);
    }
  }, [kind]);

  useEffect(() => {
    void loadHierarchyFilters();
  }, [loadHierarchyFilters]);

  useEffect(() => {
    if (kind !== "RETAILER") {
      setDistOptions([{ value: "", label: "All distributors" }]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const raw = await listAllSuperAdminNetworkUsers("DISTRIBUTOR", {
          masterDistributorId: masterDistributorId || undefined,
        });
        if (cancelled) return;
        const { users } = filterVisibleNetworkUsers(raw);
        const filtered = masterDistributorId
          ? users.filter((user) => {
              const detail = user as UserDetailRecord;
              const mdId =
                detail.masterDistributor?.id ||
                detail.parentUser?.id ||
                detail.parentId;
              return !mdId || mdId === masterDistributorId;
            })
          : users;
        setDistOptions([
          { value: "", label: "All distributors" },
          ...filtered.map((user) => ({
            value: user.id,
            label:
              `${getNetworkUserName(user)}${
                user.userCode ? ` · ${user.userCode}` : ""
              }`.trim(),
          })),
        ]);
      } catch {
        if (!cancelled) {
          setDistOptions([{ value: "", label: "All distributors" }]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, masterDistributorId]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listSuperAdminNetworkUsers(kind, {
        ...queryParams,
        page: pageIndex + 1,
        pageSize,
      });
      let { users, hiddenCount } = filterVisibleNetworkUsers(result.data);

      if (masterDistributorId) {
        users = users.filter((user) => {
          const detail = user as UserDetailRecord;
          const parentIsMaster = String(
            detail.parentUser?.userType || ""
          )
            .toUpperCase()
            .includes("MASTER");
          const mdId =
            detail.masterDistributor?.id ||
            (parentIsMaster ? detail.parentUser?.id : undefined);
          if (!detail.masterDistributor && !parentIsMaster) return true;
          return mdId === masterDistributorId;
        });
      }
      if (distributorId) {
        users = users.filter((user) => {
          const detail = user as UserDetailRecord;
          const distId =
            detail.distributor?.id ||
            detail.parentUser?.id ||
            detail.parentId;
          if (!distId) return true;
          return distId === distributorId;
        });
      }
      if (search) {
        users = users.filter((user) => matchesHierarchySearch(user, search));
      }

      setData(users);
      setTotal(Math.max(0, (result.total ?? result.data.length) - hiddenCount));
    } catch (err) {
      setData([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [
    kind,
    queryParams,
    pageIndex,
    pageSize,
    masterDistributorId,
    distributorId,
    search,
  ]);

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
          getUserVerificationStatus(user) === verificationStatus
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
    setStatus("");
    setVerificationStatus("");
    setMasterDistributorId("");
    setDistributorId("");
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
    let { users } = filterVisibleNetworkUsers(raw);
    if (search) {
      users = users.filter((user) => matchesHierarchySearch(user, search));
    }
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
      const next = getUserVerificationStatus(user);
      if (next === "PENDING") pending += 1;
      else if (next === "VERIFIED") verified += 1;
      else if (next === "REJECTED") rejected += 1;
    }
    return { pending, verified, rejected, total: data.length };
  }, [data]);

  const summaryCards = useMemo(
    () => [
      {
        label: `Total ${ADMIN_NETWORK_USER_KIND_LABEL[kind]}s`,
        value: String(total),
        hint: "All records",
        icon: Users,
        iconClassName: "bg-slate-900/10 text-slate-900 dark:bg-primary/15 dark:text-primary",
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

  const activeFilterCount = [
    search,
    fromDate,
    toDate,
    status,
    verificationStatus,
    masterDistributorId,
    distributorId,
    sortBy !== "createdAt" || sortOrder !== "desc",
  ].filter(Boolean).length;

  return (
    <div className="page-container space-y-6">
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.06)] dark:border-border dark:bg-card sm:p-6"
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l opacity-[0.08]",
            meta.accent
          )}
        />
        <PageHeader
          breadcrumb={meta.breadcrumb}
          title={meta.title}
          subtitle={`${ADMIN_NETWORK_USER_KIND_LABEL[kind]} network directory · ${total.toLocaleString()} total records`}
          action={
            kind === "RETAILER" ? (
              <Button
                onClick={() => {
                  clearUserFormDraft("RETAILER");
                  setCreateRetailerOpen(true);
                }}
              >
                <UserPlus className="h-4 w-4" />
                Create Retailer
              </Button>
            ) : kind === "DISTRIBUTOR" ? (
              <Button
                onClick={() => {
                  clearUserFormDraft("DISTRIBUTOR");
                  setCreateDistributorOpen(true);
                }}
              >
                <UserPlus className="h-4 w-4" />
                Create Distributor
              </Button>
            ) : null
          }
        />
      </div>

      {enableVerification ? <ReportStatsRow items={summaryCards} /> : (
        <ReportStatsRow
          items={[
            {
              label: `Total ${ADMIN_NETWORK_USER_KIND_LABEL[kind]}s`,
              value: String(total),
              hint: "All records",
              icon: Users,
              iconClassName:
                "bg-slate-900/10 text-slate-900 dark:bg-primary/15 dark:text-primary",
            },
            {
              label: "This page",
              value: String(tableData.length),
              hint: `Page ${pageIndex + 1} of ${pageCount}`,
              icon: Filter,
              iconClassName: "bg-sky-500/10 text-sky-600",
            },
            {
              label: "Page size",
              value: String(pageSize),
              hint: "Rows per page",
              icon: ArrowDownUp,
              iconClassName: "bg-violet-500/10 text-violet-600",
            },
            {
              label: "Active filters",
              value: String(activeFilterCount),
              hint: activeFilterCount ? "Applied" : "None",
              icon: Search,
              iconClassName: "bg-amber-500/10 text-amber-600",
            },
          ]}
        />
      )}

      {error ? (
        <div className="rounded-2xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      ) : null}

      <Card className="space-y-5 border-slate-200/90 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:border-border sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-foreground">
              Filters &amp; search
            </h3>
            <p className="text-xs text-slate-500">
              Refine the directory without cluttering the browser URL
            </p>
          </div>
          {activeFilterCount ? (
            <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white dark:bg-primary">
              {activeFilterCount} active
            </span>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2">
            <Input
              label="Search"
              placeholder={meta.searchPlaceholder}
              icon={<Search className="h-4 w-4" />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Input
            label="From date"
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPageIndex(0);
            }}
          />
          <Input
            label="To date"
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPageIndex(0);
            }}
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPageIndex(0);
            }}
            options={STATUS_FILTER_OPTIONS}
          />
          {enableVerification ? (
            <Select
              label="Verification"
              value={verificationStatus}
              onChange={(e) => {
                setVerificationStatus(e.target.value);
                setPageIndex(0);
              }}
              options={VERIFICATION_FILTER_OPTIONS}
            />
          ) : null}
          <Select
            label="Sort by"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPageIndex(0);
            }}
            options={SORT_OPTIONS}
          />
          <Select
            label="Order"
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value as "asc" | "desc");
              setPageIndex(0);
            }}
            options={[
              { value: "desc", label: "Newest first" },
              { value: "asc", label: "Oldest first" },
            ]}
          />
          {kind === "RETAILER" || kind === "DISTRIBUTOR" ? (
            <Select
              label="Master distributor"
              value={masterDistributorId}
              onChange={(e) => {
                setMasterDistributorId(e.target.value);
                setDistributorId("");
                setPageIndex(0);
              }}
              options={mdOptions}
            />
          ) : null}
          {kind === "RETAILER" ? (
            <Select
              label="Distributor"
              value={distributorId}
              onChange={(e) => {
                setDistributorId(e.target.value);
                setPageIndex(0);
              }}
              options={distOptions}
            />
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => void loadData()}
            disabled={isLoading || exportLoading}
          >
            <Search className="h-4 w-4" />
            Apply
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
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 border-slate-200/90 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:border-border sm:p-6">
        <ReportExportBar
          loading={exportLoading}
          onExportExcel={() => void handleExportExcel()}
          onExportPdf={() => void handlePrintOrPdf("pdf")}
          left={
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-foreground">
                Directory results
              </p>
              <p className="text-xs text-slate-500">
                Total records:{" "}
                <span className="font-bold tabular-nums text-slate-800 dark:text-foreground">
                  {total.toLocaleString()}
                </span>
                {" · "}
                Page{" "}
                <span className="font-bold tabular-nums">
                  {pageIndex + 1}
                </span>{" "}
                of{" "}
                <span className="font-bold tabular-nums">{pageCount}</span>
              </p>
            </div>
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
          minTableWidth={kind === "RETAILER" ? 2600 : 2200}
        />
      </Card>

      <NetworkUserCrudModals crud={crud} />
      {enableVerification ? verification.dialogs : null}

      {kind === "RETAILER" ? (
        <CreateRetailerModal
          open={createRetailerOpen}
          scope="super_admin"
          onClose={() => setCreateRetailerOpen(false)}
          onCreated={() => {
            void loadData();
          }}
        />
      ) : null}

      {kind === "DISTRIBUTOR" ? (
        <CreateDistributorModal
          open={createDistributorOpen}
          scope="super_admin"
          onClose={() => setCreateDistributorOpen(false)}
          onCreated={() => {
            void loadData();
          }}
        />
      ) : null}
    </div>
  );
}
