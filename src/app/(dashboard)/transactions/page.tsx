"use client";

import { useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchTransactions } from "@/store/slices/balanceSlice";
import { DataTable } from "@/components/tables/DataTable";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Transaction } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TransactionsPage() {
  const dispatch = useAppDispatch();
  const { transactions, isLoading } = useAppSelector((state) => state.balance);

  useEffect(() => {
    dispatch(fetchTransactions({ page: 1, pageSize: 50 }));
  }, [dispatch]);

  const columns: ColumnDef<Transaction, unknown>[] = [
    { accessorKey: "id", header: "Transaction ID" },
    { accessorKey: "fromUserName", header: "From" },
    { accessorKey: "toUserName", header: "To" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status as "success" | "pending" | "rejected"}>
          {row.original.status}
        </Badge>
      ),
    },
    { accessorKey: "remarks", header: "Remarks" },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-sm text-muted">View all balance transfer transactions</p>
      </div>
      <Card>
        <DataTable
          data={transactions?.data || []}
          columns={columns}
          isLoading={isLoading}
          searchPlaceholder="Search transactions..."
        />
      </Card>
    </div>
  );
}
