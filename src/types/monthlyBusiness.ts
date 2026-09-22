export type BusinessReportPeriod = "daily" | "weekly" | "monthly" | "yearly";

export interface MonthlyBusinessMonth {
  month: number;
  monthName: string;
  business: number;
  transactionCount: number;
}

export interface MonthlyBusinessSummary {
  year: number;
  totalBusiness: number;
  totalTransactions: number;
  months: MonthlyBusinessMonth[];
  growthPercent?: number | null;
}

export interface MonthlyBusinessQuery {
  year: number;
  service?: string;
}

export interface BusinessReportQuery {
  period?: BusinessReportPeriod;
  year: number;
  month?: number;
  service?: string;
  userId?: string;
}

export interface BusinessReportPoint {
  key: string;
  label: string;
  date?: string | null;
  year?: number | null;
  month?: number | null;
  day?: number | null;
  weekday?: number | null;
  hour?: number | null;
  business: number;
  transactionCount: number;
  successfulTransactions: number;
  failedTransactions: number;
  charges: number;
  commission: number;
  isPeak?: boolean;
}

export interface BusinessServiceRow {
  code: string;
  name: string;
  business: number;
  transactionCount: number;
  commission: number;
  charges: number;
  sharePercent: number;
}

export interface TransactionBreakdown {
  successful: number;
  failed: number;
  pending: number;
  total: number;
}

export interface BusinessReportSummary {
  period: BusinessReportPeriod;
  year: number;
  month: number | null;
  totalBusiness: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalCharges: number;
  totalCommission: number;
  series: BusinessReportPoint[];
  services: BusinessServiceRow[];
  breakdown: TransactionBreakdown;
  months: MonthlyBusinessMonth[];
  growthPercent: number | null;
}
