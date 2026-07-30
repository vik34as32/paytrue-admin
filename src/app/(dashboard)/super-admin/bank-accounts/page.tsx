"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { DataTable } from "@/components/tables/DataTable";
import { ReportExportBar } from "@/components/tables/ReportExportBar";
import {
  SuperAdminListFilters,
  SuperAdminListFiltersValue,
} from "@/components/super-admin/SuperAdminListFilters";
import {
  BankAccountCrudModals,
  useBankAccountTableColumns,
} from "@/components/super-admin/BankAccountCrudModals";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { getBankAccounts } from "@/services/bankAccountApi";
import { ROUTES } from "@/constants";
import { BankAccountRecord } from "@/types/bankAccount";
import { formatDate } from "@/lib/utils";
import {
  downloadReportExcel,
  downloadReportPdf,
  reportFilename,
} from "@/lib/reportExport";

const PAGE_SIZE = 10;

const EXPORT_COLUMNS = [
  { key: "#", label: "#" },
  { key: "accountHolderName", label: "Account Holder" },
  { key: "bankName", label: "Bank" },
  { key: "accountNumber", label: "Account Number" },
  { key: "ifscCode", label: "IFSC" },
  { key: "branchName", label: "Branch" },
  { key: "upiId", label: "UPI ID" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Created" },
];

function toExportRows(items: BankAccountRecord[]) {
  return items.map((item, index) => ({
    "#": index + 1,
    accountHolderName: item.accountHolderName || "—",
    bankName: item.bankName || "—",
    accountNumber: item.accountNumber || "—",
    ifscCode: item.ifscCode || "—",
    branchName: item.branchName || "—",
    upiId: item.upiId || "—",
    status: item.status || (item.isActive ? "ACTIVE" : "INACTIVE"),
    createdAt: item.createdAt ? formatDate(item.createdAt) : "—",
  }));
}

export default function SuperAdminBankAccountsPage() {
  const router = useRouter();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const [data, setData] = useState<BankAccountRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [filters, setFilters] = useState<SuperAdminListFiltersValue>({
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getBankAccounts({
        page: pageIndex + 1,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      setData(result.data);
      setTotal(result.total ?? result.data.length);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load bank accounts"
      );
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, search, filters]);

  const loadAllForExport = useCallback(async () => {
    const pageSize = 100;
    let page = 1;
    let totalPages = 1;
    const collected: BankAccountRecord[] = [];
    do {
      const result = await getBankAccounts({
        page,
        pageSize,
        search: search || undefined,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      collected.push(...result.data);
      totalPages =
        result.totalPages ||
        Math.max(1, Math.ceil((result.total || collected.length) / pageSize));
      if (!result.data.length) break;
      page += 1;
    } while (page <= totalPages);
    return collected;
  }, [search, filters]);

  const { columns, crud } = useBankAccountTableColumns(() => {
    void loadAccounts();
  });

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
      return;
    }
    void loadAccounts();
  }, [hasSuperAdminWalletAccess, router, loadAccounts]);

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      const items = await loadAllForExport();
      if (!items.length) {
        toast.error("No records available to export");
        return;
      }
      downloadReportExcel(
        toExportRows(items),
        reportFilename("bank-accounts"),
        "Bank Accounts"
      );
      toast.success(`Excel downloaded (${items.length} records)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExportLoading(true);
      const items = await loadAllForExport();
      if (!items.length) {
        toast.error("No records available to export");
        return;
      }
      downloadReportPdf({
        title: "Bank Accounts",
        subtitle: "System bank accounts report",
        filename: reportFilename("bank-accounts"),
        columns: EXPORT_COLUMNS,
        rows: toExportRows(items),
      });
      toast.success("PDF print dialog opened");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PDF export failed");
    } finally {
      setExportLoading(false);
    }
  };

  if (!hasSuperAdminWalletAccess) return null;

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Super Admin"
        title="Bank Accounts"
        subtitle="Manage system bank accounts used for fund deposits"
        action={
          <Button onClick={crud.openCreate}>
            <Plus className="h-4 w-4" />
            Add Bank Account
          </Button>
        }
      />

      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <Card>
        <SuperAdminListFilters
          value={filters}
          onChange={(next) => {
            setFilters(next);
            setPageIndex(0);
          }}
          showStatus
          showSort
          sortOptions={[
            { value: "createdAt", label: "Created Date" },
            { value: "bankName", label: "Bank Name" },
            { value: "accountHolderName", label: "Account Holder" },
          ]}
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setPageIndex(0);
          }}
          searchPlaceholder="Search by bank name, account holder, IFSC..."
          resultsCount={data.length}
        />

        <ReportExportBar
          className="mb-4"
          loading={exportLoading || isLoading}
          onExportExcel={() => void handleExportExcel()}
          onExportPdf={() => void handleExportPdf()}
        />

        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          hideSearch
          manualPagination
          pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={PAGE_SIZE}
          totalRows={total}
          tone="report"
        />
      </Card>

      <BankAccountCrudModals crud={crud} />
    </div>
  );
}
