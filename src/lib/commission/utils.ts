import { CommissionRangeRow, CommissionValueType } from "@/types/commission";
import { FINTECH_SERVICES } from "@/constants/commissionServices";

export type CommissionPersistState = "saved" | "new" | "edited";

export function formatCommissionValue(
  type: CommissionValueType,
  value: number
): string {
  if (type === "percentage") return `${value}%`;
  return `₹${value}`;
}

export function getServiceName(serviceId: string): string {
  return FINTECH_SERVICES.find((s) => s.id === serviceId)?.name ?? serviceId;
}

export function createRowId(): string {
  return `comm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function isLocalCommissionId(id: string): boolean {
  return !id || id.startsWith("comm_");
}

export function getCommissionPersistState(
  row: CommissionRangeRow
): CommissionPersistState {
  if (row.isNew || isLocalCommissionId(row.id)) return "new";
  if (row.isDirty) return "edited";
  return "saved";
}

/** Next non-overlapping range start (inclusive ranges cannot share endpoints). */
export function nextRangeFromForService(
  rows: CommissionRangeRow[],
  serviceId: string,
  retailerId?: string
): number {
  const peers = rows.filter(
    (row) =>
      row.serviceId === serviceId &&
      (!retailerId || row.retailerId === retailerId)
  );
  if (!peers.length) return 1;
  return Math.max(...peers.map((row) => row.rangeTo), 0) + 1;
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
