"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/common/Badge";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import {
  fetchAdminMasterDistributors,
  fetchAdminDistributors,
  fetchAdminRetailers,
} from "@/store/api/adminModuleApi";
import { getNetworkUserName } from "@/services/adminApi";
import { AdminNetworkUser } from "@/types/admin";
import { useRoleAccess } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";

type ViewMode = "tree" | "table";

interface HierarchyRow {
  id: string;
  level: string;
  name: string;
  email?: string;
  balance: number;
  status?: string;
  parent?: string;
}

export function AdminHierarchyView() {
  const dispatch = useAppDispatch();
  const { user } = useRoleAccess();
  const { masterDistributors, distributors, retailers } = useAppSelector(
    (state) => state.adminModule
  );
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const isLoading =
    masterDistributors.isLoading ||
    distributors.isLoading ||
    retailers.isLoading;

  useEffect(() => {
    dispatch(fetchAdminMasterDistributors({ page: 1, pageSize: 200 }));
    dispatch(fetchAdminDistributors({ page: 1, pageSize: 200 }));
    dispatch(fetchAdminRetailers({ page: 1, pageSize: 200 }));
  }, [dispatch]);

  const tableRows = useMemo<HierarchyRow[]>(() => {
    const rows: HierarchyRow[] = [
      {
        id: user?.id || "admin",
        level: "Admin",
        name: user?.name || "Admin",
        email: user?.email,
        balance: user?.balance ?? 0,
        status: "active",
      },
    ];

    masterDistributors.data.forEach((md: AdminNetworkUser) => {
      rows.push({
        id: md.id,
        level: "Master Distributor",
        name: getNetworkUserName(md),
        email: md.email,
        balance: md.walletBalance ?? 0,
        status: md.status,
        parent: user?.name || "Admin",
      });
    });

    distributors.data.forEach((d: AdminNetworkUser) => {
      rows.push({
        id: d.id,
        level: "Distributor",
        name: getNetworkUserName(d),
        email: d.email,
        balance: d.walletBalance ?? 0,
        status: d.status,
        parent: "Downline",
      });
    });

    retailers.data.forEach((r: AdminNetworkUser) => {
      rows.push({
        id: r.id,
        level: "Retailer",
        name: getNetworkUserName(r),
        email: r.email,
        balance: r.walletBalance ?? 0,
        status: r.status,
        parent: "Downline",
      });
    });

    return rows;
  }, [masterDistributors.data, distributors.data, retailers.data, user]);

  const columns: ColumnDef<HierarchyRow, unknown>[] = [
    { accessorKey: "level", header: "Level" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "balance",
      header: "Wallet",
      cell: ({ row }) => formatCurrency(row.original.balance),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="default">{row.original.status || "—"}</Badge>
      ),
    },
    { accessorKey: "parent", header: "Parent" },
  ];

  return (
    <div className="page-container space-y-6">
      <PageHeader
        breadcrumb="Admin"
        title="User Hierarchy"
        subtitle="Organizational structure under your administration"
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === "tree" ? "primary" : "outline"}
              onClick={() => setViewMode("tree")}
            >
              Tree View
            </Button>
            <Button
              size="sm"
              variant={viewMode === "table" ? "primary" : "outline"}
              onClick={() => setViewMode("table")}
            >
              Table View
            </Button>
          </div>
        }
      />

      {viewMode === "tree" ? (
        <Card>
          <CardHeader title="Organization Tree" />
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="font-semibold text-primary">Admin</p>
              <p className="text-muted">{user?.name || user?.email}</p>
            </div>
            <div className="ml-6 space-y-3 border-l-2 border-primary/20 pl-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Master Distributors ({masterDistributors.data.length})
              </p>
              {isLoading && masterDistributors.data.length === 0 ? (
                <p className="text-muted">Loading...</p>
              ) : masterDistributors.data.length === 0 ? (
                <p className="text-muted">No master distributors</p>
              ) : (
                masterDistributors.data.map((md) => (
                  <div
                    key={md.id}
                    className="rounded-xl border border-border p-3"
                  >
                    <p className="font-medium">{getNetworkUserName(md)}</p>
                    <p className="text-xs text-muted">{md.email}</p>
                    <div className="mt-3 ml-4 space-y-2 border-l border-border pl-3">
                      <p className="text-xs text-muted">
                        Distributors ({distributors.data.length}) · Retailers (
                        {retailers.data.length})
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="ml-6 space-y-2 border-l-2 border-secondary/20 pl-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Distributors ({distributors.data.length})
              </p>
              {distributors.data.slice(0, 5).map((d) => (
                <p key={d.id} className="text-muted">
                  {getNetworkUserName(d)}
                </p>
              ))}
              {distributors.data.length > 5 && (
                <p className="text-xs text-muted">
                  +{distributors.data.length - 5} more
                </p>
              )}
            </div>
            <div className="ml-6 space-y-2 border-l-2 border-accent-green/20 pl-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Retailers ({retailers.data.length})
              </p>
              {retailers.data.slice(0, 5).map((r) => (
                <p key={r.id} className="text-muted">
                  {getNetworkUserName(r)}
                </p>
              ))}
              {retailers.data.length > 5 && (
                <p className="text-xs text-muted">
                  +{retailers.data.length - 5} more
                </p>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <DataTable
            data={tableRows}
            columns={columns}
            isLoading={isLoading}
            searchPlaceholder="Search hierarchy..."
            pageSize={15}
          />
        </Card>
      )}
    </div>
  );
}
