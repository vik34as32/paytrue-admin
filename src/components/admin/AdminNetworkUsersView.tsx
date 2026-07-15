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
import {
  AdminManagedUserRole,
  listAdminUsers,
  listAllAdminUsers,
  mapAdminListFiltersToUsersParams,
} from "@/services/adminUsersApi";
import { NetworkUserRecord } from "@/types/superAdmin";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  UserPlus,
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
  const [search, setSearch] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [filters, setFilters] = useState<AdminListFiltersValue>({
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const queryParams = useMemo(
    () =>
      mapAdminListFiltersToUsersParams(
        {
          search: search || undefined,
          status: filters.status,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
        userKind
      ),
    [search, filters, userKind]
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
      setData(result.data);
      setTotal(result.total ?? result.data.length);
    } catch (err) {
      setData([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [queryParams, pageIndex]);

  const { columns, crud } = useAdminUserTableColumns(userKind, () => {
    void loadData();
  });

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
    const users = await listAllAdminUsers(queryParams);
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
    <div className="page-container">
      <PageHeader
        breadcrumb="Admin"
        title={title}
        subtitle={subtitle}
        action={
          <div className="flex flex-wrap items-center gap-2">
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
              onClick={() => void handleExportExcel()}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={exportLoading || isLoading}
              onClick={() => void handlePrintOrPdf("pdf")}
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={exportLoading || isLoading}
              isLoading={exportLoading}
              onClick={() => void handlePrintOrPdf("print")}
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            {createHref && createLabel ? (
              <Link
                href={createHref}
                onClick={() => clearUserFormDraft(userKind)}
              >
                <Button>
                  <UserPlus className="h-4 w-4" />
                  {createLabel}
                </Button>
              </Link>
            ) : null}
          </div>
        }
      />

      {error ? (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      ) : null}

      <Card>
        <AdminListFilters
          value={filters}
          onChange={(next) => {
            setFilters(next);
            setPageIndex(0);
          }}
          showSort
          showDateRange
        />
        <p className="mb-3 text-xs text-muted">
          Powered by <code>/api/v1/admin/users</code> — search name / email /
          phone, sort, date range, View / Edit / Delete. Export pulls every
          matching record (e.g. 1000+), not only the current page.
        </p>
        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          searchPlaceholder={searchPlaceholder}
          onSearch={(value) => {
            setSearch(value);
            setPageIndex(0);
          }}
          manualPagination
          pageCount={Math.max(1, Math.ceil((total || 0) / PAGE_SIZE))}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={PAGE_SIZE}
          tone="network"
        />
      </Card>

      <AdminUserCrudModals crud={crud} />
    </div>
  );
}
