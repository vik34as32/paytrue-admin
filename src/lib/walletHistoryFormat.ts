import { formatCurrency, formatDate } from "@/lib/utils";
import { WalletHistoryRecord } from "@/types/superAdmin";

export function resolveHistoryDate(record: WalletHistoryRecord): string {
  if (record.date) return record.date;
  if (record.createdAt) {
    try {
      return formatDate(record.createdAt, "dd MMM yyyy");
    } catch {
      return "—";
    }
  }
  return "—";
}

export function resolveHistoryTime(record: WalletHistoryRecord): string {
  if (record.time) return record.time;
  if (record.createdAt) {
    try {
      return formatDate(record.createdAt, "hh:mm a");
    } catch {
      return "—";
    }
  }
  return "—";
}

export function resolveTopupAmount(record: WalletHistoryRecord): number {
  return record.topupAmount ?? record.amount ?? 0;
}

export function resolveCurrentBalance(record: WalletHistoryRecord): number {
  return record.previousBalance ?? record.balanceBefore ?? 0;
}

export function resolveUpdatedBalance(record: WalletHistoryRecord): number {
  return (
    record.updatedBalance ??
    record.currentBalance ??
    record.balanceAfter ??
    0
  );
}

export function toWalletHistoryExportRows(
  records: WalletHistoryRecord[]
): Record<string, unknown>[] {
  return records.map((record) => ({
    Date: resolveHistoryDate(record),
    Time: resolveHistoryTime(record),
    "Current Balance": resolveCurrentBalance(record),
    "Topup Balance": resolveTopupAmount(record),
    "Updated Balance": resolveUpdatedBalance(record),
    Remarks: record.remarks || "",
  }));
}

export function formatMoney(value: number): string {
  return formatCurrency(value);
}
