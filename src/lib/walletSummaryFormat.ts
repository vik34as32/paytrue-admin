import { formatCurrency, formatDate } from "@/lib/utils";
import {
  WalletSummaryActivityRecord,
  WalletSummaryHeader,
  WalletSummaryUserType,
} from "@/types/walletSummary";

export function formatWalletUserType(type?: string): string {
  if (!type) return "—";
  const map: Record<string, string> = {
    ADMIN: "Admin",
    MASTER_DISTRIBUTOR: "Master Distributor",
    DISTRIBUTOR: "Distributor",
    RETAILER: "Retailer",
  };
  return map[type] || type.replace(/_/g, " ");
}

export function formatOperationType(type?: string): string {
  if (!type) return "—";
  const upper = type.toUpperCase();
  if (upper.includes("CREDIT") || upper.includes("ADD")) return "CREDIT";
  if (upper.includes("DEDUCT") || upper.includes("DEBIT")) return "DEDUCT";
  return type.replace(/_/g, " ");
}

export function resolveActivityDate(record: WalletSummaryActivityRecord): string {
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

export function resolveActivityTime(record: WalletSummaryActivityRecord): string {
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

export function computeActivityTotals(records: WalletSummaryActivityRecord[]) {
  let totalCreditAmount = 0;
  let totalDeductAmount = 0;

  for (const record of records) {
    const type = formatOperationType(record.operationType).toUpperCase();
    if (type === "CREDIT") totalCreditAmount += record.amount || 0;
    if (type === "DEDUCT") totalDeductAmount += record.amount || 0;
  }

  return {
    recordCount: records.length,
    totalCreditAmount,
    totalDeductAmount,
  };
}

export function mergeHeaderTotals(
  header: WalletSummaryHeader | null | undefined,
  records: WalletSummaryActivityRecord[]
) {
  const computed = computeActivityTotals(records);
  return {
    currentBalance: header?.currentBalance ?? 0,
    totalCreditAmount: header?.totalCreditAmount ?? computed.totalCreditAmount,
    totalDeductAmount: header?.totalDeductAmount ?? computed.totalDeductAmount,
    recordCount: computed.recordCount,
    totalCreditCount: header?.totalCreditCount,
    totalDeductCount: header?.totalDeductCount,
  };
}

export function toWalletSummaryExportRows(
  records: WalletSummaryActivityRecord[]
): Record<string, unknown>[] {
  return records.map((record, index) => ({
    "#": index + 1,
    Date: resolveActivityDate(record),
    Time: resolveActivityTime(record),
    Reference: record.reference || "",
    Type: formatOperationType(record.operationType),
    Amount: record.amount,
    Status: record.status || "",
    "Performed By": record.performedByName || "",
    Role: record.performedByRole || "",
    "User Code": record.performedByCode || "",
    "Previous Balance": record.previousBalance ?? "",
    "Updated Balance": record.updatedBalance ?? "",
    Remarks: record.remarks || "",
    "Fund Request Ref": record.fundRequestRef || "",
  }));
}

export function formatWalletMoney(value: number): string {
  return formatCurrency(value);
}

export const WALLET_SUMMARY_TAB_LABELS: Record<
  WalletSummaryUserType,
  string
> = {
  MASTER_DISTRIBUTOR: "Master Distributor",
  DISTRIBUTOR: "Distributor",
  RETAILER: "Retailer",
};
