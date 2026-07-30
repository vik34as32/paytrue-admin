"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal, Eye, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/common/Button";
import { WalletBadge } from "@/components/wallets/WalletBadge";
import { WalletPagination } from "@/components/wallets/WalletPagination";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { WalletBalanceRow } from "@/types/walletBalances";

type SortKey =
  | "name"
  | "userCode"
  | "role"
  | "status"
  | "mainWallet"
  | "commissionWallet"
  | "totalCommissionEarned"
  | "lastWalletUpdated";

interface WalletTableProps {
  rows: WalletBalanceRow[];
  isLoading?: boolean;
  isFetching?: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewWallet: (userId: string) => void;
}

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Unable to copy ${label.toLowerCase()}`);
  }
}

function ActionsMenu({
  row,
  onViewWallet,
}: {
  row: WalletBalanceRow;
  onViewWallet: (userId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"id" | "code" | null>(null);

  return (
    <div className="relative flex justify-end">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label={`Actions for ${row.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label="Close actions menu"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-9 z-20 min-w-[180px] rounded-xl border border-border bg-card p-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-background"
              onClick={() => {
                setOpen(false);
                onViewWallet(row.userId);
              }}
            >
              <Eye className="h-4 w-4 text-primary" />
              View Wallet
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-background"
              onClick={async () => {
                await copyText("User ID", row.userId);
                setCopied("id");
                setOpen(false);
              }}
            >
              {copied === "id" ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4 text-muted" />
              )}
              Copy User ID
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-background disabled:opacity-50"
              disabled={!row.userCode}
              onClick={async () => {
                if (!row.userCode) return;
                await copyText("User Code", row.userCode);
                setCopied("code");
                setOpen(false);
              }}
            >
              {copied === "code" ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4 text-muted" />
              )}
              Copy User Code
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function SortIcon({
  active,
  desc,
}: {
  active: boolean;
  desc: boolean;
}) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
  return desc ? (
    <ArrowDown className="h-3.5 w-3.5" />
  ) : (
    <ArrowUp className="h-3.5 w-3.5" />
  );
}

export function WalletTable({
  rows,
  isLoading,
  isFetching,
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onViewWallet,
}: WalletTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("mainWallet");
  const [sortDesc, setSortDesc] = useState(true);

  const sortedRows = useMemo(() => {
    const next = [...rows];
    next.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDesc ? bv - av : av - bv;
      }
      const as = String(av ?? "");
      const bs = String(bv ?? "");
      return sortDesc ? bs.localeCompare(as) : as.localeCompare(bs);
    });
    return next;
  }, [rows, sortKey, sortDesc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc((d) => !d);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const headers: { key: SortKey | "actions"; label: string; align?: "right" }[] =
    [
      { key: "name", label: "User" },
      { key: "userCode", label: "User Code" },
      { key: "role", label: "Role" },
      { key: "status", label: "Status" },
      { key: "mainWallet", label: "Main Wallet", align: "right" },
      { key: "commissionWallet", label: "Commission Wallet", align: "right" },
      {
        key: "totalCommissionEarned",
        label: "Total Commission Earned",
        align: "right",
      },
      { key: "lastWalletUpdated", label: "Last Wallet Updated" },
      { key: "actions", label: "Actions", align: "right" },
    ];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        isFetching && !isLoading ? "opacity-95" : ""
      )}
    >
      <div className="max-h-[640px] overflow-auto">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead className="sticky top-0 z-[1] bg-card/95 backdrop-blur">
            <tr className="border-b border-border">
              {headers.map((h) => {
                const sortable = h.key !== "actions";
                const active = sortable && sortKey === h.key;
                return (
                  <th
                    key={h.key}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted",
                      h.align === "right" && "text-right"
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-1.5 hover:text-foreground",
                          h.align === "right" && "ml-auto"
                        )}
                        onClick={() => toggleSort(h.key as SortKey)}
                        aria-label={`Sort by ${h.label}`}
                      >
                        {h.label}
                        <SortIcon active={!!active} desc={sortDesc} />
                      </button>
                    ) : (
                      h.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {headers.map((h) => (
                      <td key={h.key} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted/25" />
                      </td>
                    ))}
                  </tr>
                ))
              : sortedRows.map((row) => (
                  <tr
                    key={row.userId}
                    className="border-b border-border transition-colors last:border-0 hover:bg-primary/[0.03]"
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-foreground">{row.name}</p>
                      <p className="text-xs text-muted">
                        {row.email || row.mobile || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs">
                      {row.userCode || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <WalletBadge type="role" value={row.role} />
                    </td>
                    <td className="px-4 py-3.5">
                      <WalletBadge type="status" value={row.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium tabular-nums">
                      {formatCurrency(row.mainWallet)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium tabular-nums">
                      {formatCurrency(row.commissionWallet)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium tabular-nums">
                      {formatCurrency(row.totalCommissionEarned)}
                    </td>
                    <td className="px-4 py-3.5">
                      {formatDate(row.lastWalletUpdated, "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3.5">
                      <ActionsMenu row={row} onViewWallet={onViewWallet} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <WalletPagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={onPageChange}
        disabled={isFetching}
      />
    </div>
  );
}
