export interface BankAccountRecord {
  id: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName?: string;
  upiId?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface BankAccountListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateBankAccountPayload {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName?: string;
  upiId?: string;
  status?: string;
}

export interface UpdateBankAccountPayload {
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  upiId?: string;
  status?: string;
}

export interface PaginatedBankAccounts {
  data: BankAccountRecord[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface BankAccountAssignmentRecord {
  id: string;
  userId: string;
  bankAccountId: string;
  userType?: string;
  userTypeLabel?: string;
  name: string;
  mobile?: string;
  email?: string;
  userCode?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  status?: string;
  assignedAt?: string;
}

export interface BankAccountAssignmentsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  userType?: string;
  status?: string;
}

export interface PaginatedBankAccountAssignments {
  data: BankAccountAssignmentRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}
