"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import {
  AdminListFilters,
  AdminListFiltersValue,
} from "@/components/admin/AdminListFilters";
import {
  NetworkUserCrudModals,
  useNetworkUserTableColumns,
} from "@/components/super-admin/NetworkUserCrudModals";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { clearUserFormDraft } from "@/lib/userFormDraftStorage";
import { AdminListQueryParams } from "@/types/admin";
import { NetworkUserRecord } from "@/types/superAdmin";
import { RootState } from "@/store";
import { UserPlus } from "lucide-react";

const PAGE_SIZE = 10;

type ListState = {
  data: NetworkUserRecord[];
  total: number;
  isLoading: boolean;
  error: string | null;
};

interface AdminNetworkUsersViewProps {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  createHref?: string;
  createLabel?: string;
  draftUserType?: "MASTER_DISTRIBUTOR" | "DISTRIBUTOR" | "RETAILER";
  selectList: (state: RootState) => ListState;
  fetchList: (
    params: AdminListQueryParams
  ) => // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any;
}

export function AdminNetworkUsersView({
  title,
  subtitle,
  searchPlaceholder,
  createHref,
  createLabel,
  draftUserType,
  selectList,
  fetchList,
}: AdminNetworkUsersViewProps) {
  const dispatch = useAppDispatch();
  const { data, total, isLoading, error } = useAppSelector(selectList);
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdminListFiltersValue>({
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const loadData = useCallback(() => {
    void dispatch(
      fetchList({
        page: pageIndex + 1,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
    );
  }, [dispatch, fetchList, pageIndex, search, filters]);

  const { columns, crud } = useNetworkUserTableColumns(loadData);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tableData = useMemo(() => data, [data]);

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Admin"
        title={title}
        subtitle={subtitle}
        action={
          createHref && createLabel ? (
            <Link
              href={createHref}
              onClick={() => {
                if (draftUserType) clearUserFormDraft(draftUserType);
              }}
            >
              <Button>
                <UserPlus className="h-4 w-4" />
                {createLabel}
              </Button>
            </Link>
          ) : undefined
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
          Search works across name, phone and email. Use start/end date and
          sort to refine results. View / Edit / Delete are available on each
          row.
        </p>
        <DataTable
          data={tableData}
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
        />
      </Card>

      <NetworkUserCrudModals crud={crud} />
    </div>
  );
}
