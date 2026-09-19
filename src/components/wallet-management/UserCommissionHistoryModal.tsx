"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Modal } from "@/components/modals/Modal";
import { Badge } from "@/components/common/Badge";
import { DataTable } from "@/components/tables/DataTable";
import { formatCurrency } from "@/lib/utils";
import {
  earnedCommissionForUser,
  fetchCommissionEngineHistory,
} from "@/services/commissionEngineApi";
import { CommissionEngineHistoryItem } from "@/types/commissionEngineHistory";
import { WalletUser } from "@/types/wallet";
import { toast } from "sonner";

const PAGE_SIZE = 20;

interface UserCommissionHistoryModalProps {
  open: boolean;
  user: WalletUser | null;
  onClose: () => void;
}

function formatDateTime(raw?: string | null) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString("en-IN");
}

function statusVariant(
  status?: string
): "success" | "pending" | "rejected" | "default" {
  const value = (status || "").toUpperCase();
  if (value === "SUCCESS") return "success";
  if (value === "PENDING" || value === "PROCESSING") return "pending";
  if (value === "FAILED") return "rejected";
  return "default";
}

export function UserCommissionHistoryModal({
  open,
  user,
  onClose,
}: UserCommissionHistoryModalProps) {
  const userId = user?.userId || user?.id || "";
  const [rows, setRows] = useState<CommissionEngineHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!open) return;
    setPageIndex(0);
  }, [open, userId]);

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const role = String(user?.role || "").toUpperCase();
        const result = await fetchCommissionEngineHistory({
          userId,
          retailerId: role === "RETAILER" ? userId : undefined,
          page: pageIndex + 1,
          pageSize: PAGE_SIZE,
        });
        if (cancelled) return;
        setRows(result.items);
        setTotal(result.pagination.total);
        setPageCount(Math.max(1, result.pagination.totalPages));
      } catch (error) {
        if (!cancelled) {
          setRows([]);
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load commission history"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userId, user?.role, pageIndex]);

  const columns = useMemo<ColumnDef<CommissionEngineHistoryItem, unknown>[]>(
    () => [
      {
        id: "date",
        header: "Date & Time",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm tabular-nums">
            {formatDateTime(row.original.transactionAt)}
          </span>
        ),
      },
      {
        id: "reference",
        header: "Reference",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.reference}</span>
        ),
      },
      {
        id: "from",
        header: "Commission from",
        enableSorting: false,
        cell: ({ row }) => {
          const retailer = row.original.retailer;
          return (
            <div className="min-w-[140px]">
              <p className="truncate font-medium">
                {retailer?.name || "Retailer"}
              </p>
              <p className="truncate text-xs text-muted">
                Txn by retailer
              </p>
            </div>
          );
        },
      },
      {
        id: "service",
        header: "Service",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.service?.serviceName ||
          row.original.service?.serviceId ||
          "—",
      },
      {
        id: "txnAmount",
        header: "Txn Amount",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatCurrency(row.original.transactionAmount)}
          </span>
        ),
      },
      {
        id: "earned",
        header: "Your Commission",
        enableSorting: false,
        meta: { align: "right" as const },
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
            {formatCurrency(earnedCommissionForUser(row.original, userId))}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        meta: { align: "center" as const },
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {row.original.status}
          </Badge>
        ),
      },
    ],
    [userId]
  );

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Commission History"
      subtitle={
        user
          ? `${user.name || "User"}${user.userCode ? ` · ${user.userCode}` : ""}${
              user.mobile ? ` · ${user.mobile}` : ""
            }`
          : undefined
      }
      size="2xl"
    >
      <DataTable
        data={rows}
        columns={columns}
        isLoading={loading}
        hideSearch
        manualPagination
        pageIndex={pageIndex}
        pageCount={pageCount}
        onPageChange={setPageIndex}
        pageSize={PAGE_SIZE}
        totalRows={total}
        minTableWidth={980}
        tone="report"
        stickyHeader
      />
    </Modal>
  );
}
