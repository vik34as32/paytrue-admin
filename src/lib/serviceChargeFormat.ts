import {
  ServiceChargeFrequency,
  ServiceChargeHistoryRecord,
  ServiceChargePlan,
  ServiceChargeRole,
  ServiceChargeStatus,
  ServiceChargeType,
} from "@/types/serviceCharge";
import { formatCurrency, formatDate } from "@/lib/utils";

export function formatServiceChargeAmount(
  amount: number,
  chargeType?: ServiceChargeType | string
): string {
  if (String(chargeType || "").toUpperCase() === "PERCENTAGE") {
    return `${amount}%`;
  }
  return formatCurrency(amount);
}

export function formatFrequency(value?: string | null): string {
  if (!value) return "—";
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function formatChargeType(value?: string | null): string {
  if (!value) return "—";
  return value === "PERCENTAGE" ? "Percentage" : "Fixed";
}

export function formatRoleLabel(role?: string | null): string {
  switch (String(role || "").toUpperCase()) {
    case "RETAILER":
      return "Retailer";
    case "DISTRIBUTOR":
      return "Distributor";
    case "MASTER_DISTRIBUTOR":
      return "Master Distributor";
    default:
      return role || "—";
  }
}

export function formatRoles(roles?: ServiceChargeRole[] | string[] | null): string {
  if (!roles?.length) return "—";
  return roles.map(formatRoleLabel).join(", ");
}

export function formatExecutionDay(
  frequency?: ServiceChargeFrequency | string | null,
  day?: number | string | null
): string {
  if (day === null || day === undefined || day === "") return "—";
  const freq = String(frequency || "").toUpperCase();
  if (freq === "DAILY") return "Every day";
  if (freq === "WEEKLY") {
    const map: Record<string, string> = {
      "1": "Monday",
      "2": "Tuesday",
      "3": "Wednesday",
      "4": "Thursday",
      "5": "Friday",
      "6": "Saturday",
      "7": "Sunday",
      MONDAY: "Monday",
      TUESDAY: "Tuesday",
      WEDNESDAY: "Wednesday",
      THURSDAY: "Thursday",
      FRIDAY: "Friday",
      SATURDAY: "Saturday",
      SUNDAY: "Sunday",
    };
    return map[String(day).toUpperCase()] || String(day);
  }
  return `Day ${day}`;
}

export function formatCreatedBy(
  plan: Pick<ServiceChargePlan, "createdBy" | "createdByName">
): string {
  if (plan.createdByName) return plan.createdByName;
  const by = plan.createdBy;
  if (!by) return "—";
  if (typeof by === "string") return by;
  return by.name || by.email || "—";
}

export function formatPlanDate(value?: string | null): string {
  if (!value) return "—";
  return formatDate(value);
}

export function statusBadgeVariant(
  status?: string | null
): "success" | "pending" | "rejected" | "inactive" | "default" {
  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
    case "SUCCESS":
      return "success";
    case "PAUSED":
    case "PENDING":
    case "DRAFT":
      return "pending";
    case "FAILED":
      return "rejected";
    case "INACTIVE":
    case "COMPLETED":
    case "SKIPPED":
      return "inactive";
    default:
      return "default";
  }
}

export function historyStatusLabel(status?: string | null): string {
  if (!status) return "—";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function toHistoryDisplayDate(record: ServiceChargeHistoryRecord): string {
  return formatDate(record.executionDate || record.createdAt || "");
}
