"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/common/Badge";
import { formatCurrency } from "@/lib/utils";
import {
  getAdminDisplayName,
  getAdminBalance,
  getAdminId,
} from "@/services/admin";
import { AdminRecord } from "@/types/superAdmin";

interface AdminListTableProps {
  admins: AdminRecord[];
  isLoading?: boolean;
}

export function AdminListTable({ admins, isLoading }: AdminListTableProps) {
  const columns: ColumnDef<AdminRecord, unknown>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => getAdminDisplayName(row.original),
    },
    {
      accessorKey: "id",
      header: "Admin ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{getAdminId(row.original)}</span>
      ),
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "mobile", header: "Mobile" },
    {
      accessorKey: "userType",
      header: "User Type",
      cell: ({ row }) => (
        <Badge variant="default">
          {(row.original.userType || "ADMIN").toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "balance",
      header: "Wallet Balance",
      cell: ({ row }) => (
        <span className="font-semibold text-primary">
          {formatCurrency(getAdminBalance(row.original))}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={admins}
      columns={columns}
      isLoading={isLoading}
      searchPlaceholder="Search admins by name, email, mobile..."
    />
  );
}

export function useAdminSelectOptions(admins: AdminRecord[]) {
  return admins.map((admin) => ({
    value: getAdminId(admin),
    label: `${getAdminDisplayName(admin)} (Admin Id: ${getAdminId(admin)}) — Balance ${formatCurrency(getAdminBalance(admin))}`,
    admin,
  }));
}
