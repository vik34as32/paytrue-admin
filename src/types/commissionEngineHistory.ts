export interface CommissionHistoryPerson {
  id: string;
  name: string | null;
}

export interface CommissionHistoryService {
  serviceId: string;
  serviceName: string;
}

export interface CommissionHistoryAmount {
  type?: string | null;
  rate?: number | null;
  amount?: number | null;
}

export interface CommissionPaidTo {
  role: string;
  userId: string;
  type?: string | null;
  rate?: number | null;
  amount: number;
  paidAt?: string | null;
}

export interface CommissionEngineHistoryItem {
  id: string;
  reference: string;
  status: string;
  transactionAt?: string | null;
  commissionedAt?: string | null;
  retailer: CommissionHistoryPerson | null;
  distributor: CommissionHistoryPerson | null;
  masterDistributor: CommissionHistoryPerson | null;
  service: CommissionHistoryService | null;
  transactionAmount: number;
  commissions: {
    retailer: CommissionHistoryAmount;
    distributor: CommissionHistoryAmount;
    masterDistributor: CommissionHistoryAmount;
    companyMargin?: number | null;
  };
  commissionPaidTo: CommissionPaidTo[];
}

export interface CommissionEngineHistoryResult {
  items: CommissionEngineHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
