import { z } from "zod";
import { ServiceChargePlan } from "@/types/serviceCharge";

export const SERVICE_CHARGE_FREQUENCIES = [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
] as const;

export const SERVICE_CHARGE_TYPES = ["FIXED"] as const;

export const SERVICE_CHARGE_STATUSES = [
  "ACTIVE",
  "PAUSED",
  "INACTIVE",
  "DRAFT",
] as const;

export const SERVICE_CHARGE_ROLES = [
  "RETAILER",
  "DISTRIBUTOR",
  "MASTER_DISTRIBUTOR",
] as const;

export const serviceChargeFormSchema = z
  .object({
    planName: z
      .string()
      .trim()
      .min(2, "Plan name must be at least 2 characters")
      .max(150, "Plan name is too long"),
    amount: z
      .number({ error: "Amount is required" })
      .positive("Amount must be greater than 0")
      .max(10_000_000, "Amount exceeds maximum"),
    chargeType: z.enum(SERVICE_CHARGE_TYPES),
    frequency: z.enum(SERVICE_CHARGE_FREQUENCIES),
    executionTime: z
      .string()
      .min(1, "Execution time is required")
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm format (24-hour)"),
    executionDay: z.union([z.string(), z.number()]).optional().nullable(),
    executionMonth: z.union([z.string(), z.number()]).optional().nullable(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional().or(z.literal("")),
    role: z.enum(SERVICE_CHARGE_ROLES),
    retailerIds: z.array(z.string()),
    remarks: z.string().trim().max(1000).optional().or(z.literal("")),
    status: z.enum(SERVICE_CHARGE_STATUSES),
  })
  .superRefine((values, ctx) => {
    if (values.endDate && values.startDate && values.endDate < values.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be on or after start date",
      });
    }

    if (values.frequency === "WEEKLY") {
      const day = Number(values.executionDay);
      if (!Number.isFinite(day) || day < 1 || day > 7) {
        ctx.addIssue({
          code: "custom",
          path: ["executionDay"],
          message: "Select execution day for weekly plans",
        });
      }
    }

    if (values.frequency === "MONTHLY" || values.frequency === "YEARLY") {
      const day = Number(values.executionDay);
      if (!Number.isFinite(day) || day < 1 || day > 31) {
        ctx.addIssue({
          code: "custom",
          path: ["executionDay"],
          message: "Enter a valid day of month (1–31)",
        });
      }
    }

    if (values.frequency === "YEARLY") {
      const month = Number(values.executionMonth);
      if (!Number.isFinite(month) || month < 1 || month > 12) {
        ctx.addIssue({
          code: "custom",
          path: ["executionMonth"],
          message: "Select execution month for yearly plans",
        });
      }
    }

    if (
      values.role === "RETAILER" &&
      (!values.retailerIds || values.retailerIds.length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["retailerIds"],
        message: "Select at least one retailer",
      });
    }
  });

export type ServiceChargeFormValues = z.infer<typeof serviceChargeFormSchema>;

export const serviceChargeEmptyDefaults: ServiceChargeFormValues = {
  planName: "",
  amount: 0,
  chargeType: "FIXED",
  frequency: "MONTHLY",
  executionTime: "00:00",
  executionDay: "1",
  executionMonth: "1",
  startDate: "",
  endDate: "",
  role: "RETAILER",
  retailerIds: [],
  remarks: "",
  status: "ACTIVE",
};

export function mapPlanToFormValues(
  plan: ServiceChargePlan
): ServiceChargeFormValues {
  const status = SERVICE_CHARGE_STATUSES.includes(
    plan.status as (typeof SERVICE_CHARGE_STATUSES)[number]
  )
    ? (plan.status as ServiceChargeFormValues["status"])
    : "ACTIVE";

  const role =
    plan.role ||
    plan.applicableRoles?.[0] ||
    ("RETAILER" as const);

  const retailerId = plan.retailerId || plan.targetUserId || null;

  return {
    planName: plan.planName || "",
    amount: plan.amount ?? 0,
    chargeType: "FIXED",
    frequency: plan.frequency || "MONTHLY",
    executionTime: (plan.executionTime || "00:00").slice(0, 5),
    executionDay:
      plan.executionDay === null || plan.executionDay === undefined
        ? ""
        : String(plan.executionDay),
    executionMonth:
      plan.executionMonth === null || plan.executionMonth === undefined
        ? "1"
        : String(plan.executionMonth),
    startDate: (plan.startDate || "").slice(0, 10),
    endDate: plan.endDate ? String(plan.endDate).slice(0, 10) : "",
    role,
    retailerIds: retailerId
      ? [retailerId]
      : plan.retailerIds?.length
        ? plan.retailerIds
        : [],
    remarks: plan.remarks || "",
    status,
  };
}

export const FREQUENCY_OPTIONS = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

export const CHARGE_TYPE_OPTIONS = [
  { value: "FIXED", label: "Fixed Amount" },
];

export const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "DRAFT", label: "Draft" },
];

export const ROLE_OPTIONS = [
  { value: "RETAILER", label: "Retailer" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "MASTER_DISTRIBUTOR", label: "Master Distributor" },
];

export const WEEKDAY_OPTIONS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "7", label: "Sunday" },
];

export const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export const FILTER_STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  ...STATUS_OPTIONS,
  { value: "COMPLETED", label: "Completed" },
];

export const FILTER_FREQUENCY_OPTIONS = [
  { value: "", label: "All Frequency" },
  ...FREQUENCY_OPTIONS,
];

export const FILTER_ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  ...ROLE_OPTIONS,
];
