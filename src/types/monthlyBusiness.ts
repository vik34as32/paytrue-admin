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
