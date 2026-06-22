import {
  User,
  AuthUser,
  LoginCredentials,
  Transaction,
  LedgerEntry,
  BalanceRequest,
  HistoryEntry,
  DashboardStats,
  ChartDataPoint,
  ActivityItem,
  HierarchyNode,
  TableFilters,
  PaginatedResponse,
  UserRole,
} from "@/types";
import { generateId, isCreatedToday } from "@/lib/utils";
import { REQUEST_APPROVAL_CHAIN } from "@/constants";

const STORAGE_KEYS = {
  users: "paytrue_users",
  transactions: "paytrue_transactions",
  ledger: "paytrue_ledger",
  requests: "paytrue_requests",
  history: "paytrue_history",
  initialized: "paytrue_initialized",
};

function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const data = localStorage.getItem(key);
  return data ? (JSON.parse(data) as T) : fallback;
}

function setStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

function seedData(): void {
  if (getStorage(STORAGE_KEYS.initialized, false)) return;

  const now = new Date().toISOString();
  const users: User[] = [
    {
      id: "u1",
      name: "Super Admin",
      email: "superadmin@paytrue.com",
      mobile: "9999999999",
      password: "admin123",
      role: "super_admin",
      status: "active",
      balance: 10000000,
      parentId: null,
      createdBy: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "u2",
      name: "Admin User",
      email: "admin@paytrue.com",
      mobile: "8888888888",
      password: "admin123",
      role: "admin",
      status: "active",
      balance: 5000000,
      parentId: "u1",
      createdBy: "u1",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "u3",
      name: "Master Distributor",
      email: "master@paytrue.com",
      mobile: "7777777777",
      password: "admin123",
      role: "master_distributor",
      status: "active",
      balance: 2000000,
      parentId: "u2",
      createdBy: "u2",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "u4",
      name: "Distributor User",
      email: "distributor@paytrue.com",
      mobile: "6666666666",
      password: "admin123",
      role: "distributor",
      status: "active",
      balance: 500000,
      parentId: "u3",
      createdBy: "u3",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "u5",
      name: "Retailer User",
      email: "retailer@paytrue.com",
      mobile: "5555555555",
      password: "admin123",
      role: "retailer",
      status: "active",
      balance: 50000,
      parentId: "u4",
      createdBy: "u4",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const transactions: Transaction[] = [
    {
      id: "t1",
      fromUserId: "u4",
      toUserId: "u5",
      fromUserName: "Distributor User",
      toUserName: "Retailer User",
      amount: 10000,
      status: "success",
      remarks: "Monthly balance allocation",
      createdAt: now,
    },
    {
      id: "t2",
      fromUserId: "u3",
      toUserId: "u4",
      fromUserName: "Master Distributor",
      toUserName: "Distributor User",
      amount: 50000,
      status: "success",
      remarks: "Quarterly top-up",
      createdAt: now,
    },
    {
      id: "t3",
      fromUserId: "u2",
      toUserId: "u3",
      fromUserName: "Admin User",
      toUserName: "Master Distributor",
      amount: 100000,
      status: "pending",
      remarks: "Pending approval transfer",
      createdAt: now,
    },
  ];

  const ledger: LedgerEntry[] = transactions
    .filter((t) => t.status === "success")
    .map((t) => ({
      id: generateId("LED"),
      transactionId: t.id,
      fromUserId: t.fromUserId,
      toUserId: t.toUserId,
      fromUserName: t.fromUserName,
      toUserName: t.toUserName,
      amount: t.amount,
      openingBalance: 0,
      closingBalance: t.amount,
      remarks: t.remarks,
      status: t.status,
      createdAt: t.createdAt,
    }));

  const history: HistoryEntry[] = [
    {
      id: "h1",
      type: "user_creation",
      description: "Created retailer account",
      performedBy: "u4",
      performedByName: "Distributor User",
      targetUser: "u5",
      targetUserName: "Retailer User",
      createdAt: now,
    },
    {
      id: "h2",
      type: "balance_transfer",
      description: "Transferred ₹10,000 to Retailer User",
      performedBy: "u4",
      performedByName: "Distributor User",
      createdAt: now,
    },
    {
      id: "h3",
      type: "login",
      description: "Successful login",
      performedBy: "u1",
      performedByName: "Super Admin",
      createdAt: now,
    },
  ];

  setStorage(STORAGE_KEYS.users, users);
  setStorage(STORAGE_KEYS.transactions, transactions);
  setStorage(STORAGE_KEYS.ledger, ledger);
  setStorage(STORAGE_KEYS.requests, []);
  setStorage(STORAGE_KEYS.history, history);
  setStorage(STORAGE_KEYS.initialized, true);
}

function addHistory(entry: Omit<HistoryEntry, "id" | "createdAt">): void {
  const history = getStorage<HistoryEntry[]>(STORAGE_KEYS.history, []);
  history.unshift({
    ...entry,
    id: generateId("HIS"),
    createdAt: new Date().toISOString(),
  });
  setStorage(STORAGE_KEYS.history, history);
}

function toAuthUser(user: User): AuthUser {
  const { password: _, ...authUser } = user;
  return authUser;
}

function paginate<T>(
  items: T[],
  page = 1,
  pageSize = 10
): PaginatedResponse<T> {
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
  };
}

export const mockApi = {
  init: () => seedData(),

  login: async (credentials: LoginCredentials) => {
    seedData();
    const users = getStorage<User[]>(STORAGE_KEYS.users, []);
    const user = users.find(
      (u) =>
        u.mobile === credentials.mobile && u.password === credentials.password
    );
    if (!user) throw new Error("Invalid mobile number or password");
    if (user.status === "suspended") throw new Error("Account is suspended");
    if (user.status === "inactive") throw new Error("Account is inactive");

    addHistory({
      type: "login",
      description: "Successful login",
      performedBy: user.id,
      performedByName: user.name,
    });

    return {
      user: toAuthUser(user),
      accessToken: `access_${user.id}_${Date.now()}`,
      refreshToken: `refresh_${user.id}_${Date.now()}`,
    };
  },

  getUsers: async (filters?: TableFilters) => {
    seedData();
    let users = getStorage<User[]>(STORAGE_KEYS.users, []);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.mobile.includes(q)
      );
    }
    if (filters?.status) {
      users = users.filter((u) => u.status === filters.status);
    }
    if (filters?.sortBy) {
      const key = filters.sortBy as keyof User;
      users.sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal === bVal) return 0;
        const cmp = aVal! < bVal! ? -1 : 1;
        return filters.sortOrder === "desc" ? -cmp : cmp;
      });
    }
    return paginate(users, filters?.page, filters?.pageSize);
  },

  getUserById: async (id: string) => {
    const users = getStorage<User[]>(STORAGE_KEYS.users, []);
    const user = users.find((u) => u.id === id);
    if (!user) throw new Error("User not found");
    return toAuthUser(user);
  },

  createUser: async (
    data: Omit<User, "id" | "createdAt" | "updatedAt">,
    createdBy: string
  ) => {
    const users = getStorage<User[]>(STORAGE_KEYS.users, []);
    if (users.some((u) => u.mobile === data.mobile)) {
      throw new Error("Mobile number already exists");
    }
    if (users.some((u) => u.email === data.email)) {
      throw new Error("Email already exists");
    }
    const creator = users.find((u) => u.id === createdBy);
    const now = new Date().toISOString();
    const newUser: User = {
      ...data,
      id: generateId("USR"),
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
    users.push(newUser);
    setStorage(STORAGE_KEYS.users, users);
    addHistory({
      type: "user_creation",
      description: `Created ${data.role.replace("_", " ")} account for ${data.name}`,
      performedBy: createdBy,
      performedByName: creator?.name || "System",
      targetUser: newUser.id,
      targetUserName: newUser.name,
    });
    return toAuthUser(newUser);
  },

  updateUser: async (id: string, data: Partial<User>, updatedBy: string) => {
    const users = getStorage<User[]>(STORAGE_KEYS.users, []);
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("User not found");
    const updater = users.find((u) => u.id === updatedBy);
    users[index] = {
      ...users[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    setStorage(STORAGE_KEYS.users, users);
    addHistory({
      type: "update",
      description: `Updated profile for ${users[index].name}`,
      performedBy: updatedBy,
      performedByName: updater?.name || "System",
      targetUser: id,
      targetUserName: users[index].name,
    });
    return toAuthUser(users[index]);
  },

  deleteUser: async (id: string) => {
    const users = getStorage<User[]>(STORAGE_KEYS.users, []);
    const filtered = users.filter((u) => u.id !== id);
    setStorage(STORAGE_KEYS.users, filtered);
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    seedData();
    const users = getStorage<User[]>(STORAGE_KEYS.users, []);
    const transactions = getStorage<Transaction[]>(STORAGE_KEYS.transactions, []);
    const todayTxns = transactions.filter((t) => isCreatedToday(t.createdAt));

    return {
      totalRetailers: users.filter((u) => u.role === "retailer").length,
      todayRetailers: users.filter(
        (u) => u.role === "retailer" && isCreatedToday(u.createdAt)
      ).length,
      totalDistributors: users.filter((u) => u.role === "distributor").length,
      todayDistributors: users.filter(
        (u) => u.role === "distributor" && isCreatedToday(u.createdAt)
      ).length,
      totalAdmins: users.filter((u) => u.role === "admin").length,
      todayAdmins: users.filter(
        (u) => u.role === "admin" && isCreatedToday(u.createdAt)
      ).length,
      totalMasterDistributors: users.filter(
        (u) => u.role === "master_distributor"
      ).length,
      todayMasterDistributors: users.filter(
        (u) =>
          u.role === "master_distributor" && isCreatedToday(u.createdAt)
      ).length,
      todayTransactions: todayTxns.length,
      successTransactions: transactions.filter((t) => t.status === "success")
        .length,
      pendingTransactions: transactions.filter((t) => t.status === "pending")
        .length,
      rejectedTransactions: transactions.filter((t) => t.status === "rejected")
        .length,
    };
  },

  getChartData: async (): Promise<{
    monthly: ChartDataPoint[];
    revenue: ChartDataPoint[];
  }> => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return {
      monthly: months.map((name, i) => ({
        name,
        value: Math.floor(Math.random() * 500) + 100 + i * 20,
        transactions: Math.floor(Math.random() * 200) + 50,
      })),
      revenue: months.map((name, i) => ({
        name,
        value: Math.floor(Math.random() * 500000) + 100000 + i * 50000,
        revenue: Math.floor(Math.random() * 500000) + 100000 + i * 50000,
      })),
    };
  },

  getRecentActivities: async (): Promise<ActivityItem[]> => {
    const history = getStorage<HistoryEntry[]>(STORAGE_KEYS.history, []);
    return history.slice(0, 8).map((h) => ({
      id: h.id,
      title: h.description,
      description: `By ${h.performedByName}`,
      time: h.createdAt,
      type:
        h.type === "user_creation"
          ? "user"
          : h.type === "balance_transfer"
            ? "transaction"
            : h.type === "login"
              ? "system"
              : "request",
    }));
  },

  getTransactions: async (filters?: TableFilters) => {
    let transactions = getStorage<Transaction[]>(STORAGE_KEYS.transactions, []);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.fromUserName.toLowerCase().includes(q) ||
          t.toUserName.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)
      );
    }
    if (filters?.status) {
      transactions = transactions.filter((t) => t.status === filters.status);
    }
    return paginate(transactions, filters?.page, filters?.pageSize);
  },

  transferBalance: async (
    fromUserId: string,
    toUserId: string,
    amount: number,
    remarks: string
  ) => {
    const users = getStorage<User[]>(STORAGE_KEYS.users, []);
    const fromIndex = users.findIndex((u) => u.id === fromUserId);
    const toIndex = users.findIndex((u) => u.id === toUserId);
    if (fromIndex === -1 || toIndex === -1) throw new Error("User not found");
    if (users[fromIndex].balance < amount) throw new Error("Insufficient balance");

    const openingBalance = users[toIndex].balance;
    users[fromIndex].balance -= amount;
    users[toIndex].balance += amount;
    setStorage(STORAGE_KEYS.users, users);

    const txnId = generateId("TXN");
    const now = new Date().toISOString();
    const transaction: Transaction = {
      id: txnId,
      fromUserId,
      toUserId,
      fromUserName: users[fromIndex].name,
      toUserName: users[toIndex].name,
      amount,
      status: "success",
      remarks,
      createdAt: now,
    };

    const transactions = getStorage<Transaction[]>(STORAGE_KEYS.transactions, []);
    transactions.unshift(transaction);
    setStorage(STORAGE_KEYS.transactions, transactions);

    const ledger = getStorage<LedgerEntry[]>(STORAGE_KEYS.ledger, []);
    ledger.unshift({
      id: generateId("LED"),
      transactionId: txnId,
      fromUserId,
      toUserId,
      fromUserName: users[fromIndex].name,
      toUserName: users[toIndex].name,
      amount,
      openingBalance,
      closingBalance: openingBalance + amount,
      remarks,
      status: "success",
      createdAt: now,
    });
    setStorage(STORAGE_KEYS.ledger, ledger);

    addHistory({
      type: "balance_transfer",
      description: `Transferred ₹${amount.toLocaleString("en-IN")} to ${users[toIndex].name}`,
      performedBy: fromUserId,
      performedByName: users[fromIndex].name,
      targetUser: toUserId,
      targetUserName: users[toIndex].name,
    });

    return transaction;
  },

  getLedger: async (filters?: TableFilters) => {
    let ledger = getStorage<LedgerEntry[]>(STORAGE_KEYS.ledger, []);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      ledger = ledger.filter(
        (l) =>
          l.fromUserName.toLowerCase().includes(q) ||
          l.toUserName.toLowerCase().includes(q) ||
          l.transactionId.toLowerCase().includes(q)
      );
    }
    return paginate(ledger, filters?.page, filters?.pageSize);
  },

  getRequests: async (filters?: TableFilters) => {
    let requests = getStorage<BalanceRequest[]>(STORAGE_KEYS.requests, []);
    if (filters?.status) {
      requests = requests.filter((r) => r.status === filters.status);
    }
    return paginate(requests, filters?.page, filters?.pageSize);
  },

  createRequest: async (
    retailerId: string,
    amount: number,
    remarks: string
  ) => {
    const users = getStorage<User[]>(STORAGE_KEYS.users, []);
    const retailer = users.find((u) => u.id === retailerId);
    if (!retailer) throw new Error("Retailer not found");

    const distributor = users.find((u) => u.id === retailer.parentId);
    const request: BalanceRequest = {
      id: generateId("REQ"),
      retailerId,
      retailerName: retailer.name,
      amount,
      status: "pending",
      currentApproverRole: "distributor",
      approvalChain: REQUEST_APPROVAL_CHAIN.map((role) => {
        const approver = users.find(
          (u) =>
            u.role === role &&
            (role === "distributor"
              ? u.id === retailer.parentId
              : role === "master_distributor"
                ? u.id === distributor?.parentId
                : true)
        );
        return {
          role,
          userId: approver?.id || "",
          userName: approver?.name || role,
          status: "pending" as const,
          verified: false,
          remarks: "",
        };
      }),
      remarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const requests = getStorage<BalanceRequest[]>(STORAGE_KEYS.requests, []);
    requests.unshift(request);
    setStorage(STORAGE_KEYS.requests, requests);
    return request;
  },

  approveRequest: async (
    requestId: string,
    approverId: string,
    remarks: string
  ) => {
    const requests = getStorage<BalanceRequest[]>(STORAGE_KEYS.requests, []);
    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error("Request not found");

    const users = getStorage<User[]>(STORAGE_KEYS.users, []);
    const approver = users.find((u) => u.id === approverId);
    if (!approver) throw new Error("Approver not found");

    const request = requests[index];
    const chainIndex = request.approvalChain.findIndex(
      (s) => s.role === approver.role
    );
    if (chainIndex !== -1) {
      request.approvalChain[chainIndex] = {
        ...request.approvalChain[chainIndex],
        status: "approved",
        verified: true,
        remarks,
        actedAt: new Date().toISOString(),
      };
    }

    const nextRole = REQUEST_APPROVAL_CHAIN[chainIndex + 1];
    if (nextRole) {
      request.currentApproverRole = nextRole;
    } else {
      request.status = "approved";
      const retailer = users.find((u) => u.id === request.retailerId);
      if (retailer?.parentId) {
        await mockApi.transferBalance(
          retailer.parentId,
          request.retailerId,
          request.amount,
          `Approved request ${request.id}`
        );
      }
      addHistory({
        type: "approval",
        description: `Approved balance request of ₹${request.amount.toLocaleString("en-IN")}`,
        performedBy: approverId,
        performedByName: approver.name,
        targetUser: request.retailerId,
        targetUserName: request.retailerName,
      });
    }

    request.updatedAt = new Date().toISOString();
    requests[index] = request;
    setStorage(STORAGE_KEYS.requests, requests);
    return request;
  },

  rejectRequest: async (
    requestId: string,
    rejectorId: string,
    reason: string
  ) => {
    const requests = getStorage<BalanceRequest[]>(STORAGE_KEYS.requests, []);
    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error("Request not found");

    const users = getStorage<User[]>(STORAGE_KEYS.users, []);
    const rejector = users.find((u) => u.id === rejectorId);
    requests[index].status = "rejected";
    requests[index].rejectionReason = reason;
    requests[index].updatedAt = new Date().toISOString();
    setStorage(STORAGE_KEYS.requests, requests);

    addHistory({
      type: "rejection",
      description: `Rejected balance request: ${reason}`,
      performedBy: rejectorId,
      performedByName: rejector?.name || "Unknown",
      targetUser: requests[index].retailerId,
      targetUserName: requests[index].retailerName,
    });

    return requests[index];
  },

  getHistory: async (filters?: TableFilters) => {
    let history = getStorage<HistoryEntry[]>(STORAGE_KEYS.history, []);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      history = history.filter(
        (h) =>
          h.description.toLowerCase().includes(q) ||
          h.performedByName.toLowerCase().includes(q)
      );
    }
    return paginate(history, filters?.page, filters?.pageSize);
  },

  getHierarchy: async (): Promise<HierarchyNode[]> => {
    const users = getStorage<User[]>(STORAGE_KEYS.users, []);
    const buildTree = (parentId: string | null): HierarchyNode[] =>
      users
        .filter((u) => u.parentId === parentId)
        .map((u) => {
          const creator = users.find((c) => c.id === u.createdBy);
          return {
            id: u.id,
            name: u.name,
            role: u.role,
            status: u.status,
            createdBy: u.createdBy,
            createdByName: creator?.name || null,
            children: buildTree(u.id),
          };
        });
    return buildTree(null);
  },

  getChildUsers: async (parentId: string, role?: UserRole) => {
    const users = getStorage<User[]>(STORAGE_KEYS.users, []);
    return users.filter(
      (u) =>
        u.parentId === parentId || (role && u.role === role)
    );
  },

  getAllUsersFlat: async () => {
    return getStorage<User[]>(STORAGE_KEYS.users, []);
  },
};
