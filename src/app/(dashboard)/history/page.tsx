"use client";

import { useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchHistory } from "@/store/slices/reportSlice";
import { DataTable } from "@/components/tables/DataTable";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { HistoryEntry } from "@/types";
import { formatDate } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  user_creation: "User Creation",
  balance_transfer: "Balance Transfer",
  login: "Login",
  approval: "Approval",
  rejection: "Rejection",
  update: "Update",
};

export default function HistoryPage() {
  const dispatch = useAppDispatch();
  const { history, isLoading } = useAppSelector((state) => state.reports);

  useEffect(() => {
    dispatch(fetchHistory({ page: 1, pageSize: 50 }));
  }, [dispatch]);

  const columns: ColumnDef<HistoryEntry, unknown>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="default">
          {typeLabels[row.original.type] || row.original.type}
        </Badge>
      ),
    },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "performedByName", header: "Performed By" },
    {
      accessorKey: "targetUserName",
      header: "Target User",
      cell: ({ row }) => row.original.targetUserName || "—",
    },
    {
      accessorKey: "createdAt",
      header: "Date & Time",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-sm text-muted">
          Track user creation, transfers, logins, approvals and updates
        </p>
      </div>
      <Card>
        <DataTable
          data={history?.data || []}
          columns={columns}
          isLoading={isLoading}
          searchPlaceholder="Search history..."
        />
      </Card>
    </div>
  );
}
