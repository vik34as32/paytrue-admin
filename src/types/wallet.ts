export interface WalletTransferPayload {
  receiverId: string;
  amount: number;
  description: string;
}

export type WalletDeductPayload = {
  userId: string;
  amount: number;
  description: string;
};

export type WalletDeductInput = {
  userId?: string;
  receiverId?: string;
  amount: number;
  description: string;
};

export interface WalletTransferReceiver {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  balance: number;
  email?: string;
  mobile?: string;
}

/** Admin Wallet Management */

export type WalletUserRole =
  | "RETAILER"
  | "DISTRIBUTOR"
  | "MASTER_DISTRIBUTOR"
  | "ADMIN";

export type WalletUserStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "PENDING"
  | "BLOCKED";

export type WalletVerificationStatus =
  | "VERIFIED"
  | "PENDING"
  | "REJECTED"
  | "SUBMITTED";

export type WalletSortBy =
  | "name"
  | "role"
  | "mainWallet"
  | "commissionWallet"
  | "aepsWallet"
  | "totalBalance"
  | "createdAt";

export type WalletSortOrder = "asc" | "desc";

export interface WalletBalances {
  mainWallet: number;
  commissionWallet: number;
  aepsWallet: number;
  holdBalance: number;
  /** Amount locked via /wallet/freeze */
  frozenBalance: number;
  availableBalance: number;
  totalBalance: number;
}

export interface WalletUser extends WalletBalances {
  userId: string;
  id: string;
  userCode: string | null;
  name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string | null;
  mobile: string | null;
  role: WalletUserRole;
  status: WalletUserStatus | string;
  verificationStatus: WalletVerificationStatus | string;
  createdAt: string;
  updatedAt?: string;
  wallet?: {
    id: string;
    status: string;
    currency: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  outlet?: {
    id?: string | null;
    instantpayOutletId?: string | number | null;
    shopName?: string | null;
    shopAddress?: string | null;
    outletName?: string | null;
    address?: string | null;
  } | null;
  /** InstantPay / outlet identifier for display */
  outletId?: string | null;
  panNumber?: string | null;
  aadhaarNumber?: string | null;
  kycVerifiedAt?: string | null;
  /** Wallet row status (ACTIVE / FROZEN) when API provides it */
  walletStatus?: string;
}

export interface WalletListSummary {
  totalUsers: number;
  totalMainWalletBalance: number;
  totalCommissionWalletBalance: number;
  totalAepsWalletBalance: number;
  totalHoldBalance: number;
  totalFrozenBalance: number;
  totalAvailableBalance: number;
  /** Main + commission + AEPS */
  totalBalance: number;
}

export interface WalletListPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WalletUsersListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: WalletUserRole | "";
  status?: WalletUserStatus | "";
  verificationStatus?: WalletVerificationStatus | "";
  sortBy?: WalletSortBy;
  sortOrder?: WalletSortOrder;
}

export interface WalletUsersListResult {
  items: WalletUser[];
  pagination: WalletListPagination;
  summary: WalletListSummary;
}
