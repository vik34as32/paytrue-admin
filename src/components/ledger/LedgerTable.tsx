"use client";

import { useMemo } from "react";
import { Table, Button, Dropdown, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { MoreHorizontal, Eye, Copy } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import { LedgerStatusBadge } from "@/components/ledger/LedgerStatusBadge";
import { LedgerTypeBadge } from "@/components/ledger/LedgerTypeBadge";
import { formatCurrency } from "@/lib/utils";
import { LedgerRow } from "@/types/ledger";

interface LedgerTableProps {
  rows: LedgerRow[];
  loading?: boolean;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (row: LedgerRow) => void;
  selectedRowKeys: React.Key[];
  onSelectChange: (keys: React.Key[]) => void;
}

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Unable to copy ${label}`);
  }
}

export function LedgerTable({
  rows,
  loading,
  page,
  limit,
  total,
  onPageChange,
  onView,
  selectedRowKeys,
  onSelectChange,
}: LedgerTableProps) {
  const columns = useMemo<ColumnsType<LedgerRow>>(
    () => [
      {
        title: "Transaction ID",
        dataIndex: "transactionId",
        key: "transactionId",
        width: 160,
        ellipsis: true,
        sorter: (a, b) => a.transactionId.localeCompare(b.transactionId),
        fixed: "left",
      },
      {
        title: "Reference ID",
        dataIndex: "referenceId",
        key: "referenceId",
        width: 140,
        ellipsis: true,
        render: (v: string | null) => v || "—",
      },
      {
        title: "User",
        dataIndex: "userName",
        key: "userName",
        width: 160,
        ellipsis: true,
        sorter: (a, b) => a.userName.localeCompare(b.userName),
      },
      {
        title: "User Code",
        dataIndex: "userCode",
        key: "userCode",
        width: 120,
        render: (v: string | null) => (
          <Typography.Text code>{v || "—"}</Typography.Text>
        ),
      },
      {
        title: "Role",
        dataIndex: "role",
        key: "role",
        width: 140,
        render: (v: string) => v || "—",
      },
      {
        title: "Service",
        dataIndex: "serviceType",
        key: "serviceType",
        width: 120,
      },
      {
        title: "Credit",
        dataIndex: "credit",
        key: "credit",
        width: 120,
        align: "right",
        sorter: (a, b) => a.credit - b.credit,
        render: (v: number) =>
          v > 0 ? (
            <span className="font-semibold text-emerald-600">
              {formatCurrency(v)}
            </span>
          ) : (
            "—"
          ),
      },
      {
        title: "Debit",
        dataIndex: "debit",
        key: "debit",
        width: 120,
        align: "right",
        sorter: (a, b) => a.debit - b.debit,
        render: (v: number) =>
          v > 0 ? (
            <span className="font-semibold text-rose-600">
              {formatCurrency(v)}
            </span>
          ) : (
            "—"
          ),
      },
      {
        title: "Opening Balance",
        dataIndex: "openingBalance",
        key: "openingBalance",
        width: 140,
        align: "right",
        render: (v: number | null) => (v != null ? formatCurrency(v) : "—"),
      },
      {
        title: "Closing Balance",
        dataIndex: "closingBalance",
        key: "closingBalance",
        width: 140,
        align: "right",
        render: (v: number | null) => (v != null ? formatCurrency(v) : "—"),
      },
      {
        title: "Charge",
        dataIndex: "charge",
        key: "charge",
        width: 110,
        align: "right",
        render: (v: number) => formatCurrency(v),
      },
      {
        title: "Commission",
        dataIndex: "commission",
        key: "commission",
        width: 120,
        align: "right",
        render: (v: number) => formatCurrency(v),
      },
      {
        title: "GST",
        dataIndex: "gst",
        key: "gst",
        width: 100,
        align: "right",
        render: (v: number) => formatCurrency(v),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (v: string) => <LedgerStatusBadge status={v} />,
      },
      {
        title: "Type",
        dataIndex: "transactionType",
        key: "transactionType",
        width: 110,
        render: (v: string) => <LedgerTypeBadge type={v} />,
      },
      {
        title: "Created By",
        dataIndex: "createdBy",
        key: "createdBy",
        width: 140,
        ellipsis: true,
        render: (v: string | null) => v || "—",
      },
      {
        title: "Date",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 160,
        sorter: (a, b) =>
          dayjs(a.createdAt || 0).valueOf() - dayjs(b.createdAt || 0).valueOf(),
        render: (v: string | null) =>
          v ? dayjs(v).format("DD MMM YYYY, HH:mm") : "—",
      },
      {
        title: "Action",
        key: "action",
        width: 90,
        fixed: "right",
        render: (_, row) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: "view",
                  label: "View Details",
                  icon: <Eye className="h-3.5 w-3.5" />,
                  onClick: () => onView(row),
                },
                {
                  key: "copy-txn",
                  label: "Copy Transaction ID",
                  icon: <Copy className="h-3.5 w-3.5" />,
                  onClick: () => copyText("Transaction ID", row.transactionId),
                },
                {
                  key: "copy-ref",
                  label: "Copy Reference ID",
                  icon: <Copy className="h-3.5 w-3.5" />,
                  disabled: !row.referenceId,
                  onClick: () =>
                    row.referenceId &&
                    copyText("Reference ID", row.referenceId),
                },
              ],
            }}
            trigger={["click"]}
          >
            <Button
              type="text"
              aria-label={`Actions for ${row.transactionId}`}
              icon={<MoreHorizontal className="h-4 w-4" />}
            />
          </Dropdown>
        ),
      },
    ],
    [onView]
  );

  return (
    <Table<LedgerRow>
      rowKey={(r) => r.id}
      columns={columns}
      dataSource={rows}
      loading={loading}
      sticky
      scroll={{ x: 2200, y: 560 }}
      virtual
      rowSelection={{
        selectedRowKeys,
        onChange: onSelectChange,
      }}
      pagination={{
        current: page,
        pageSize: limit,
        total,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50", "100"],
        showTotal: (t, range) => `${range[0]}-${range[1]} of ${t}`,
      }}
      onChange={(pagination) => {
        onPageChange(pagination.current || 1, pagination.pageSize || limit);
      }}
      className="overflow-hidden rounded-2xl border border-border bg-card"
    />
  );
}
