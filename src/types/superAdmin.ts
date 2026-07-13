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
  state?: string;
  city?: string;
  address?: string;
}

export interface AdminRecord {
  id: string;
  adminId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  mobile?: string;
  userType?: string;
  status?: string;
  userCode?: string;
  profileImage?: string;
  walletBalance?: number;
  currentWalletBalance?: number;
  balance?: number;
  createdAt?: string;
  updatedAt?: string;
  wallet?: UserWalletRecord;
  profile?: UserProfileRecord;
  [key: string]: unknown;
}

export interface AdminDetailRecord extends AdminRecord {
  alternateMobileNumber?: string;
  parentId?: string;
  createdById?: string;
  tenantId?: string | null;
  lastLoginAt?: string;
  lastLoginIp?: string;
  isEmailVerified?: boolean;
  mobileVerified?: boolean;
  mobileVerifiedAt?: string;
  deletedAt?: string | null;
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

export interface WalletHistorySummary {
  currentWalletBalance?: number;
  totalTopupAmount?: number;
  totalTopupCount?: number;
}

export interface WalletHistoryRecord {
  id: string;
  transactionId?: string;
  date?: string;
  time?: string;
  createdAt?: string;
  updatedAt?: string;
  transactionType: string;
  amount: number;
  topupAmount?: number;
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
  summary?: WalletHistorySummary;
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
  /** API field name for current password */
  oldPassword: string;
  newPassword: string;
}

export interface UserProfileRecord {
  id?: string;
  userId?: string;
  alternateMobileNumber?: string;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserWalletRecord {
  id?: string;
  userId?: string;
  balance?: string | number;
  holdAmount?: string | number;
  status?: string;
  currency?: string;
  cardNumber?: string;
  expiryDate?: string;
  cardHolderName?: string;
  retailerCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserOutletRecord {
  id?: string;
  userId?: string;
  outletName?: string;
  businessType?: string;
  gstNumber?: string;
  address?: string;
  state?: string;
  district?: string;
  city?: string;
  village?: string;
  pincode?: string;
  latitude?: string | number;
  longitude?: string | number;
  miniKycStatus?: string | null;
  kycCompletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: string | number | null | undefined;
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
  updatedAt?: string;
  profileImage?: string;
  userType?: string;
  role?: string;
  userCode?: string;
  businessName?: string;
  outletName?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  outlet?: UserOutletRecord;
  profile?: UserProfileRecord;
  wallet?: UserWalletRecord;
  kyc?: {
    aadhaarNumber?: string;
    panNumber?: string;
    kycStatus?: string;
    status?: string;
    aadhaarFrontImage?: string;
    aadhaarBackImage?: string;
    panCardImage?: string;
    ownerPhoto?: string;
    videoVerification?: string;
    [key: string]: string | undefined;
  };
  [key: string]: unknown;
}

export interface UserDetailRecord extends NetworkUserRecord {
  alternateMobileNumber?: string;
  parentId?: string;
  createdById?: string;
  tenantId?: string | null;
  lastLoginAt?: string;
  lastLoginIp?: string;
  isEmailVerified?: boolean;
  mobileVerified?: boolean;
  mobileVerifiedAt?: string;
  deletedAt?: string | null;
  kycStatus?: string;
  bankAccount?: {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    passbookImage?: string;
    cancelledChequeImage?: string;
    [key: string]: string | undefined;
  };
  parentUser?: {
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    userType?: string;
    userCode?: string;
  };
  distributor?: {
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    userCode?: string;
  };
  masterDistributor?: {
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    userCode?: string;
  };
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
