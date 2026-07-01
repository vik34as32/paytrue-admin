export interface SuperAdminLoginPayload {
  email: string;
  password: string;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface CreateAdminPayload {
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  userType: "ADMIN";
}

export interface AddBalancePayload {
  amount: number;
  remarks: string;
}

export interface TransferBalancePayload {
  adminId: string;
  amount: number;
  remarks?: string;
}

export interface SuperAdminProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: string;
  mobile?: string;
}

export interface AdminRecord {
  id: string;
  adminId?: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  mobile: string;
  userType: string;
  walletBalance?: number;
  currentWalletBalance?: number;
  balance?: number;
  wallet?: { balance?: number };
}

export interface WalletBalanceData {
  balance?: number;
  walletBalance?: number;
  availableBalance?: number;
  virtualBalance?: number;
  totalBalance?: number;
  currentBalance?: number;
  usedBalance?: number;
  holdBalance?: number;
  pendingBalance?: number;
  transferredBalance?: number;
  creditedAmount?: number;
  debitedAmount?: number;
  lastUpdated?: string;
  updatedAt?: string;
  [key: string]: string | number | undefined;
}

export interface WalletHistoryRecord {
  id: string;
  transactionId?: string;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
  transactionType: string;
  amount: number;
  previousBalance: number;
  currentBalance: number;
  updatedBalance?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  remarks?: string;
  adminName?: string;
  adminId?: string;
  receiverName?: string;
  receiverRole?: string;
  receiverEmail?: string;
  recipientName?: string;
  status?: string;
}

export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  city?: string;
  state?: string;
  startDate?: string;
  endDate?: string;
}

export interface WalletHistoryParams extends ListQueryParams {
  transactionType?: string;
}

export interface PaginatedApiData<T> {
  data: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface SuperAdminDashboardData {
  walletBalance?: number;
  totalAdmin?: number;
  totalMasterDistributor?: number;
  totalDistributor?: number;
  totalRetailer?: number;
  totalTransfers?: number;
  totalBusiness?: number;
  [key: string]: string | number | undefined;
}

export interface SuperAdminStatisticsData {
  users?: Record<string, number>;
  transactions?: Record<string, number>;
  business?: Record<string, number>;
  wallet?: Record<string, number>;
  fundRequests?: Record<string, number>;
  profit?: Record<string, number>;
  [key: string]:
    | string
    | number
    | Record<string, number>
    | undefined;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  mobile?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface NetworkUserRecord {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  mobile?: string;
  status?: string;
  city?: string;
  state?: string;
  walletBalance?: number;
  createdAt?: string;
  [key: string]: string | number | undefined;
}

export interface AdminFundRequest {
  id: string;
  amount: number;
  status: string;
  createdAt?: string;
  adminId?: string;
  adminName?: string;
  remarks?: string;
  [key: string]: string | number | undefined;
}
