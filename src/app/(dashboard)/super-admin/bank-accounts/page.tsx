"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { DataTable } from "@/components/tables/DataTable";
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

const PAGE_SIZE = 10;

export default function SuperAdminBankAccountsPage() {
  const router = useRouter();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const [data, setData] = useState<BankAccountRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
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
        />
      </Card>

      <BankAccountCrudModals crud={crud} />
    </div>
  );
}
