export interface AdminListQueryParams {
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
  transactionType?: string;
}

export interface PaginatedAdminData<T> {
  data: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface AdminDashboardData {
  walletBalance?: number;
  todaysBusiness?: number;
  todayBusiness?: number;
  totalBusiness?: number;
  todaysTransactions?: number;
  todayTransactions?: number;
  totalTransactions?: number;
  totalRetailers?: number;
  totalDistributors?: number;
  totalMasterDistributors?: number;
  recentActivity?: AdminActivityItem[];
  [key: string]: string | number | AdminActivityItem[] | undefined;
}

export interface AdminActivityItem {
  id: string;
  title?: string;
  description?: string;
  amount?: number;
  type?: string;
  createdAt?: string;
  date?: string;
}

export interface AdminWalletBalanceData {
  balance?: number;
  walletBalance?: number;
  availableBalance?: number;
  [key: string]: string | number | undefined;
}

export interface AdminWalletHistoryRecord {
  id: string;
  transactionId?: string;
  date?: string;
  createdAt?: string;
  transactionType: string;
  amount: number;
  previousBalance?: number;
  currentBalance?: number;
  updatedBalance?: number;
  remarks?: string;
  recipientName?: string;
  masterDistributorName?: string;
  status?: string;
}

export interface AdminTransferPayload {
  masterDistributorId: string;
  amount: number;
  remarks?: string;
}

export interface AdminFundRequestPayload {
  amount: number;
  remarks: string;
}

export interface AdminFundRequestRecord {
  id: string;
  amount: number;
  status: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  mobile?: string;
  role?: string;
}

export interface AdminUpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  mobile?: string;
}

export interface AdminChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface AdminNetworkUser {
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

export interface AdminBusinessReportData {
  masterDistributorBusiness?: number;
  distributorBusiness?: number;
  retailerBusiness?: number;
  todaysBusiness?: number;
  todayBusiness?: number;
  monthlyBusiness?: number;
  totalBusiness?: number;
  [key: string]: string | number | undefined;
}

export interface CreateMasterDistributorApiPayload {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  dateOfBirth: string;
  gender: string;
  outletName: string;
  outletAddress: string;
  city: string;
  state: string;
  pincode: string;
  aadhaarNumber: string;
  panNumber: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}
