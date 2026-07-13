import { CommissionValueType } from "@/types/commission";
import { FINTECH_SERVICES } from "@/constants/commissionServices";

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
  return id.startsWith("comm_");
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
