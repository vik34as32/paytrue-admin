export interface AdminListQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  userType?: string;
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
  transferId?: string;
  date?: string;
  createdAt?: string;
  transactionType?: string;
  amount: number;
  previousBalance?: number;
  currentBalance?: number;
  updatedBalance?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  remarks?: string;
  description?: string;
  recipientName?: string;
  receiverName?: string;
  masterDistributorName?: string;
  status?: string;
}

export interface AdminTransferPayload {
  receiverId: string;
  amount: number;
  description: string;
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
  adminRemarks?: string;
  createdAt?: string;
  updatedAt?: string;
  reference?: string;
  utr?: string;
  referenceNumber?: string;
  imageUrl?: string | null;
  paymentMode?: string;
  fundingMode?: string;
  depositDate?: string;
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  requesterId?: string;
  requesterName?: string;
  requesterFirstName?: string;
  requesterLastName?: string;
  requesterType?: string;
  requesterMobile?: string;
  requesterEmail?: string;
  requesterUserCode?: string;
  userId?: string;
  userName?: string;
  userType?: string;
  actionById?: string;
  actionByName?: string;
  actionByType?: string;
  approverName?: string;
  approverType?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export interface AdminApproveFundRequestPayload {
  id: string;
  remarks: string;
}

export interface AdminRejectFundRequestPayload {
  id: string;
  remarks: string;
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
  userType?: string;
  city?: string;
  state?: string;
  walletBalance?: number;
  business?: number;
  totalBusiness?: number;
  createdAt?: string;
  assignedBankAccount?: AdminAssignedBankAccount | null;
  [key: string]: string | number | AdminAssignedBankAccount | null | undefined;
}

export interface AdminAssignedBankAccount {
  id?: string;
  bankAccountId?: string;
  assignmentId?: string;
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  status?: string;
  assignedAt?: string;
}

export interface AdminAssignBankAccountPayload {
  userIds: string[];
  bankAccountId: string;
}

export interface AdminRemoveBankAssignmentPayload {
  userId: string;
  bankAccountId: string;
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

export interface CreateMasterDistributorOutletPayload {
  outletName: string;
  businessType: string;
  gstNumber: string;
  address: string;
  state: string;
  district: string;
  city: string;
  village: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface CreateMasterDistributorKycPayload {
  aadhaarNumber: string;
  aadhaarFrontImage: string;
  aadhaarBackImage: string;
  panNumber: string;
  panCardImage: string;
  ownerPhoto: string;
  videoVerification: string;
}

export interface CreateMasterDistributorBankPayload {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  passbookImage: string;
  cancelledChequeImage: string;
}

export interface CreateMasterDistributorApiPayload {
  email: string;
  mobile: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: "MASTER_DISTRIBUTOR";
  alternateMobileNumber: string;
  profileImage: string;
  stateId: string;
  districtId: string;
  outlet: CreateMasterDistributorOutletPayload;
  kyc: CreateMasterDistributorKycPayload;
  bankAccount: CreateMasterDistributorBankPayload;
}
