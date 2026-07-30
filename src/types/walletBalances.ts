import {
  WalletUserRole,
  WalletUserStatus,
} from "@/types/wallet";

export interface WalletBalanceRow {
  userId: string;
  userCode: string | null;
  name: string;
  email: string | null;
  mobile: string | null;
  role: string;
  status: string;
  mainWallet: number;
  commissionWallet: number;
  totalCommissionEarned: number;
  lastWalletUpdated: string | null;
  avatarUrl?: string | null;
  currency: string;
}

export interface WalletBalancesStats {
  totalWalletBalance: number;
  totalCommissionWallet: number;
  totalCommissionEarned: number;
  usersCount: number;
  activeUsers: number;
}

export interface WalletBalancesPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WalletBalancesQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: WalletUserRole | "";
  status?: WalletUserStatus | "" | "ACTIVE" | "INACTIVE";
}

export interface WalletBalancesResult {
  items: WalletBalanceRow[];
  pagination: WalletBalancesPagination;
  stats: WalletBalancesStats;
  /** Backend capability flags when present */
  permissions?: {
    canListUsers?: boolean;
    canViewUserWallet?: boolean;
    selfOnly?: boolean;
  };
}

export interface WalletSummaryDetail {
  userId: string;
  userCode: string | null;
  name: string;
  email: string | null;
  mobile: string | null;
  role: string;
  status: string;
  avatarUrl?: string | null;
  mainWallet: number;
  commissionWallet: number;
  totalCommissionEarned: number;
  lastWalletUpdated: string | null;
  currency: string;
  holdBalance?: number;
  availableBalance?: number;
}
