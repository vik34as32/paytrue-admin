"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownUp,
  Filter,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { DataTable } from "@/components/tables/DataTable";
import { ReportStatsRow } from "@/components/tables/ReportStatsRow";
import { CreateAdminModal } from "@/components/super-admin/CreateAdminModal";
import {
  AdminCrudModals,
  useAdminTableColumns,
} from "@/components/super-admin/AdminCrudModals";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchAdminsList } from "@/store/api/superAdminApi";
import { selectAdminsList } from "@/store/selectors/superAdminSelectors";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const STATUS_OPTIONS = [
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
];

export default function SuperAdminAdminsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const { data, total, isLoading, error } = useAppSelector(selectAdminsList);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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

  const loadAdmins = useCallback(() => {
    dispatch(
      fetchAdminsList({
        page: pageIndex + 1,
        pageSize,
        search: search || undefined,
        status: status || undefined,
        sortBy,
        sortOrder,
      })
    );
  }, [dispatch, pageIndex, pageSize, search, status, sortBy, sortOrder]);

  const { columns, crud } = useAdminTableColumns(loadAdmins);

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
      return;
    }
    loadAdmins();
  }, [hasSuperAdminWalletAccess, router, loadAdmins]);

  const pageCount = Math.max(1, Math.ceil((total || 0) / pageSize));
  const activeFilterCount = [
    search,
    status,
    sortBy !== "createdAt" || sortOrder !== "desc",
  ].filter(Boolean).length;

  const summaryCards = useMemo(
    () => [
      {
        label: "Total Admins",
        value: String(total || 0),
        hint: "All records",
        icon: Users,
        iconClassName:
          "bg-slate-900/10 text-slate-900 dark:bg-primary/15 dark:text-primary",
      },
      {
        label: "This page",
        value: String(data.length),
        hint: `Page ${pageIndex + 1} of ${pageCount}`,
        icon: Shield,
        iconClassName: "bg-indigo-500/10 text-indigo-600",
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
        icon: Filter,
        iconClassName: "bg-amber-500/10 text-amber-600",
      },
    ],
    [total, data.length, pageIndex, pageCount, pageSize, activeFilterCount]
  );

  if (!hasSuperAdminWalletAccess) return null;

  return (
    <div className="page-container space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.06)] dark:border-border dark:bg-card sm:p-6">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-indigo-600 opacity-[0.08]" />
        <PageHeader
          breadcrumb="Network · Admins"
          title="Admin Management"
          subtitle={`Platform administrators · ${(total || 0).toLocaleString()} total records`}
          action={
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Admin
            </Button>
          }
        />
      </div>

      <ReportStatsRow items={summaryCards} />

      <CreateAdminModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={loadAdmins}
      />

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
              Clean controls — no query clutter in the URL
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
              placeholder="Search name, email, mobile…"
              icon={<Search className="h-4 w-4" />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Select
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPageIndex(0);
            }}
            options={STATUS_OPTIONS}
          />
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
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={loadAdmins} disabled={isLoading}>
            <Search className="h-4 w-4" />
            Apply
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setStatus("");
              setSortBy("createdAt");
              setSortOrder("desc");
              setPageIndex(0);
              setPageSize(10);
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAdmins}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 border-slate-200/90 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:border-border sm:p-6">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-foreground">
            Admin directory
          </p>
          <p className="text-xs text-slate-500">
            Total records:{" "}
            <span className="font-bold tabular-nums text-slate-800 dark:text-foreground">
              {(total || 0).toLocaleString()}
            </span>
            {" · "}
            Page <span className="font-bold tabular-nums">{pageIndex + 1}</span>{" "}
            of <span className="font-bold tabular-nums">{pageCount}</span>
          </p>
        </div>

        <DataTable
          data={data}
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
          totalRows={total || 0}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageIndex(0);
          }}
          minTableWidth={1100}
        />
      </Card>

      <AdminCrudModals crud={crud} />
    </div>
  );
}
