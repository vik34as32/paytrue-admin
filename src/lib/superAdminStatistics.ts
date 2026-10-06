import {
  SuperAdminServiceStats,
  SuperAdminServiceTxnCounts,
  SuperAdminStatisticsData,
  SuperAdminTransactionStatus,
  SuperAdminTxnStatusBucket,
} from "@/types/superAdmin";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function asStatNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

const EMPTY_COUNTS: SuperAdminServiceTxnCounts = {
  today: 0,
  monthly: 0,
  total: 0,
};

const EMPTY_BUCKET: SuperAdminTxnStatusBucket = {
  success: 0,
  failed: 0,
  pending: 0,
  processing: 0,
};

export function asTxnCounts(raw: unknown): SuperAdminServiceTxnCounts {
  if (raw == null || raw === "") return { ...EMPTY_COUNTS };
  if (typeof raw === "number" || typeof raw === "string") {
    const total = asStatNumber(raw);
    return { today: 0, monthly: 0, total };
  }
  const obj = asRecord(raw);
  const today = asStatNumber(
    obj.today ?? obj.todayCount ?? obj.todayTransactions ?? obj.daily
  );
  const monthly = asStatNumber(
    obj.monthly ?? obj.month ?? obj.monthlyCount ?? obj.monthlyTransactions
  );
  const total = asStatNumber(
    obj.total ??
      obj.allTime ??
      obj.count ??
      obj.totalCount ??
      obj.totalTransactions
  );
  return { today, monthly, total };
}

function firstDefined(obj: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    const match = Object.entries(obj).find(
      ([key]) => key.toLowerCase() === alias.toLowerCase()
    );
    if (match && match[1] != null && match[1] !== "") return match[1];
  }
  return undefined;
}

function statusBucket(raw: unknown): SuperAdminTxnStatusBucket {
  const obj = asRecord(raw);
  return {
    success: asStatNumber(
      obj.success ?? obj.successTransactions ?? obj.successful
    ),
    failed: asStatNumber(obj.failed ?? obj.failedTransactions ?? obj.fail),
    pending: asStatNumber(obj.pending ?? obj.pendingTransactions),
    processing: asStatNumber(
      obj.processing ?? obj.processingTransactions ?? obj.inProcess
    ),
  };
}

function fromTransactionStatus(
  raw: unknown
): SuperAdminTransactionStatus | null {
  const obj = asRecord(raw);
  if (!Object.keys(obj).length) return null;
  return {
    today: statusBucket(obj.today ?? obj.daily),
    monthly: statusBucket(obj.monthly ?? obj.month),
    total: statusBucket(obj.total ?? obj.allTime),
  };
}

function countsByStatus(
  status: SuperAdminTransactionStatus,
  key: keyof SuperAdminTxnStatusBucket
): SuperAdminServiceTxnCounts {
  return {
    today: asStatNumber(status.today?.[key]),
    monthly: asStatNumber(status.monthly?.[key]),
    total: asStatNumber(status.total?.[key]),
  };
}

export function pickServiceTxnCounts(
  service: SuperAdminServiceStats | Record<string, unknown> | null | undefined,
  aliases: string[]
): SuperAdminServiceTxnCounts {
  if (!service) return { ...EMPTY_COUNTS };
  const obj = asRecord(service);
  const direct = firstDefined(obj, aliases);
  if (direct != null) return asTxnCounts(direct);

  const nested = asRecord(obj.transactions ?? obj.txn ?? obj.statusCounts);
  const nestedValue = firstDefined(nested, aliases);
  if (nestedValue != null) return asTxnCounts(nestedValue);

  return { ...EMPTY_COUNTS };
}

const SUCCESS_ALIASES = [
  "successTransactions",
  "success",
  "successful",
  "successfulTransactions",
  "successCount",
];
const FAILED_ALIASES = [
  "failedTransactions",
  "failed",
  "failure",
  "fail",
  "failedCount",
];
const PENDING_ALIASES = [
  "pendingTransactions",
  "pending",
  "pendingCount",
];
const PROCESSING_ALIASES = [
  "processingTransactions",
  "processing",
  "inProcess",
  "inProgress",
  "processingCount",
];

export function serviceStatusCounts(service: SuperAdminServiceStats | null) {
  const obj = asRecord(service);
  const parsed =
    fromTransactionStatus(
      obj.transactionStatus ?? obj.txnStatus ?? obj.statusBreakdown
    ) || service?.transactionStatus;

  if (parsed?.today || parsed?.monthly || parsed?.total) {
    return {
      success: countsByStatus(parsed, "success"),
      failed: countsByStatus(parsed, "failed"),
      pending: countsByStatus(parsed, "pending"),
      processing: countsByStatus(parsed, "processing"),
    };
  }

  return {
    success: pickServiceTxnCounts(service, SUCCESS_ALIASES),
    failed: pickServiceTxnCounts(service, FAILED_ALIASES),
    pending: pickServiceTxnCounts(service, PENDING_ALIASES),
    processing: pickServiceTxnCounts(service, PROCESSING_ALIASES),
  };
}

export function periodCount(
  counts: SuperAdminServiceTxnCounts | undefined,
  period: "today" | "monthly" | "total"
): number {
  return asStatNumber(counts?.[period]);
}

export function pickServiceStats(
  services: Record<string, SuperAdminServiceStats> | undefined,
  aliases: string[]
): SuperAdminServiceStats | null {
  if (!services) return null;
  const entries = Object.entries(services);
  for (const alias of aliases) {
    const match = entries.find(
      ([key]) => key.toLowerCase() === alias.toLowerCase()
    );
    if (match) return match[1];
  }
  return null;
}

export type ServiceStatusTotals = {
  today: SuperAdminTxnStatusBucket;
  monthly: SuperAdminTxnStatusBucket;
  total: SuperAdminTxnStatusBucket;
};

export function aggregateServiceStatus(
  services: Record<string, SuperAdminServiceStats> | undefined,
  aliasGroups: string[][]
): ServiceStatusTotals {
  const totals: ServiceStatusTotals = {
    today: { ...EMPTY_BUCKET },
    monthly: { ...EMPTY_BUCKET },
    total: { ...EMPTY_BUCKET },
  };

  for (const aliases of aliasGroups) {
    const data = pickServiceStats(services, aliases);
    const status = serviceStatusCounts(data);
    (["today", "monthly", "total"] as const).forEach((period) => {
      totals[period].success =
        asStatNumber(totals[period].success) +
        periodCount(status.success, period);
      totals[period].failed =
        asStatNumber(totals[period].failed) + periodCount(status.failed, period);
      totals[period].pending =
        asStatNumber(totals[period].pending) +
        periodCount(status.pending, period);
      totals[period].processing =
        asStatNumber(totals[period].processing) +
        periodCount(status.processing, period);
    });
  }

  return totals;
}

function normalizeServiceStats(raw: unknown): SuperAdminServiceStats {
  const obj = asRecord(raw);
  const transactionStatus =
    fromTransactionStatus(
      obj.transactionStatus ?? obj.txnStatus ?? obj.statusBreakdown
    ) || undefined;
  const status = serviceStatusCounts({
    ...(obj as SuperAdminServiceStats),
    transactionStatus,
  });
  return {
    ...(obj as SuperAdminServiceStats),
    monthName: obj.monthName as string | undefined,
    month: obj.month == null || obj.month === "" ? undefined : asStatNumber(obj.month),
    year: obj.year == null || obj.year === "" ? undefined : asStatNumber(obj.year),
    monthLabel: obj.monthLabel as string | undefined,
    todayBusiness: asStatNumber(obj.todayBusiness),
    monthlyBusiness: asStatNumber(obj.monthlyBusiness),
    totalBusiness: asStatNumber(obj.totalBusiness),
    transactionStatus,
    successTransactions: status.success,
    failedTransactions: status.failed,
    pendingTransactions: status.pending,
    processingTransactions: status.processing,
  };
}

export function normalizeSuperAdminStatistics(
  raw: unknown
): SuperAdminStatisticsData {
  const obj = asRecord(raw);
  const servicesRaw = asRecord(obj.services);
  const services: Record<string, SuperAdminServiceStats> = {};
  for (const [key, value] of Object.entries(servicesRaw)) {
    if (value && typeof value === "object") {
      services[key] = normalizeServiceStats(value);
    }
  }

  return {
    ...(obj as SuperAdminStatisticsData),
    services,
  };
}
