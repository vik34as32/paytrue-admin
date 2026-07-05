import { UserRole } from "@/types";

export const APP_NAME = "PayTrue";
export const APP_TAGLINE = "Enterprise FinTech Management";

export const ROLES: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  master_distributor: "Master Distributor",
  distributor: "Distributor",
  retailer: "Retailer",
};

export const ROLE_HIERARCHY: UserRole[] = [
  "super_admin",
  "admin",
  "master_distributor",
  "distributor",
  "retailer",
];

export const ROLE_CAN_CREATE: Record<UserRole, UserRole[]> = {
  super_admin: ["admin", "master_distributor", "distributor", "retailer"],
  admin: [],
  master_distributor: [],
  distributor: [],
  retailer: [],
};

export const REQUEST_APPROVAL_CHAIN: UserRole[] = [
  "distributor",
  "master_distributor",
  "admin",
  "super_admin",
];

export const ROUTES = {
  login: "/login",
  superAdminLogin: "/super-admin/login",
  dashboard: "/dashboard",
  users: "/users",
  transactions: "/transactions",
  balanceTransfer: "/balance-transfer",
  requests: "/requests",
  reports: "/reports",
  ledger: "/ledger",
  hierarchy: "/hierarchy",
  history: "/history",
  profile: "/profile",
  settings: "/settings",
  superAdmin: "/super-admin",
  superAdminDashboard: "/super-admin/dashboard",
  superAdminAdmins: "/super-admin/admins",
  superAdminAddBalance: "/super-admin/add-balance",
  superAdminTransferBalance: "/super-admin/transfer-balance",
  superAdminWalletHistory: "/super-admin/wallet-history",
  superAdminCreateAdmin: "/super-admin/create-admin",
  superAdminStatistics: "/super-admin/statistics",
  superAdminRetailers: "/super-admin/retailers",
  superAdminMasterDistributors: "/super-admin/master-distributors",
  superAdminDistributors: "/super-admin/distributors",
  superAdminFundRequests: "/super-admin/fund-requests",
  superAdminChangePassword: "/super-admin/change-password",
  superAdminBankAccounts: "/super-admin/bank-accounts",
  admin: "/admin",
  adminDashboard: "/admin/dashboard",
  adminMasterDistributor: "/admin/master-distributor",
  adminCreateMasterDistributor: "/admin/create-master-distributor",
  adminBalanceTransfer: "/admin/balance-transfer",
  adminHistory: "/admin/history",
  adminProfile: "/admin/profile",
  adminChangePassword: "/admin/change-password",
  adminReports: "/admin/reports",
  adminHierarchy: "/admin/hierarchy",
  adminLedger: "/admin/ledger",
  adminFundRequests: "/admin/requests",
  adminAssignBankAccount: "/admin/bank-account-assign",
  adminCommissionManagement: "/admin/commission-management",
  masterDistributor: "/master-distributor",
  distributor: "/distributor",
  retailer: "/retailer",
} as const;

/** Super Admin and other roles sidebar */
export const SIDEBAR_ITEMS = [
  { label: "Dashboard", href: ROUTES.superAdminDashboard, icon: "dashboard", roles: ["super_admin"] as const },
  { label: "Statistics", href: ROUTES.superAdminStatistics, icon: "reports", roles: ["super_admin"] as const },
  { label: "Dashboard", href: ROUTES.dashboard, icon: "dashboard", roles: ["master_distributor", "distributor", "retailer"] as const },
  { label: "Admin Management", href: ROUTES.superAdminAdmins, icon: "users", roles: ["super_admin"] as const },
  { label: "Master Distributors", href: ROUTES.superAdminMasterDistributors, icon: "masterDistributor", roles: ["super_admin"] as const },
  { label: "Distributors", href: ROUTES.superAdminDistributors, icon: "distributor", roles: ["super_admin"] as const },
    { label: "Retailers", href: ROUTES.superAdminRetailers, icon: "retailer", roles: ["super_admin"] as const },

  { label: "Fund Requests", href: ROUTES.superAdminFundRequests, icon: "requests", roles: ["super_admin"] as const },
  { label: "Bank Accounts", href: ROUTES.superAdminBankAccounts, icon: "ledger", roles: ["super_admin"] as const },
  { label: "Add Balance", href: ROUTES.superAdminAddBalance, icon: "transfer", roles: ["super_admin"] as const },
  { label: "Change Password", href: ROUTES.superAdminChangePassword, icon: "profile", roles: ["super_admin"] as const },
  { label: "Transfer Balance", href: ROUTES.superAdminTransferBalance, icon: "transfer", roles: ["super_admin"] as const },
  { label: "Wallet History", href: ROUTES.superAdminWalletHistory, icon: "history", roles: ["super_admin"] as const },
  { label: "Users", href: ROUTES.users, icon: "users", roles: ["super_admin"] as const },
  { label: "Transactions", href: ROUTES.transactions, icon: "transactions", roles: ["super_admin", "master_distributor", "distributor"] as const },
  { label: "Balance Transfer", href: ROUTES.balanceTransfer, icon: "transfer", roles: ["master_distributor", "distributor"] as const },
  { label: "Fund Request", href: ROUTES.requests, icon: "requests", roles: ["super_admin", "master_distributor", "distributor", "retailer"] as const },
  { label: "Reports", href: ROUTES.reports, icon: "reports", roles: ["super_admin", "master_distributor", "distributor"] as const },
  { label: "Ledger", href: ROUTES.ledger, icon: "ledger", roles: ["super_admin", "master_distributor", "distributor"] as const },
  { label: "Hierarchy", href: ROUTES.hierarchy, icon: "hierarchy", roles: ["super_admin"] as const },
  { label: "History", href: ROUTES.history, icon: "history", roles: ["super_admin", "master_distributor", "distributor", "retailer"] as const },
  { label: "Profile", href: ROUTES.profile, icon: "profile", roles: ["super_admin", "master_distributor", "distributor", "retailer"] as const },
  { label: "Settings", href: ROUTES.settings, icon: "settings", roles: ["super_admin", "master_distributor", "distributor", "retailer"] as const },
] as const;

/** Admin panel — separate navigation from Super Admin */
export const ADMIN_SIDEBAR_ITEMS = [
  { label: "Dashboard", href: ROUTES.adminDashboard, icon: "dashboard" as const },
  { label: "Master Distributors", href: ROUTES.adminMasterDistributor, icon: "masterDistributor" as const },
  { label: "Balance Transfer", href: ROUTES.adminBalanceTransfer, icon: "transfer" as const },
  { label: "Assign Bank Account", href: ROUTES.adminAssignBankAccount, icon: "ledger" as const },
  { label: "Commission Management", href: ROUTES.adminCommissionManagement, icon: "commission" as const },
  { label: "Fund Requests", href: ROUTES.adminFundRequests, icon: "requests" as const },
  { label: "History", href: ROUTES.adminHistory, icon: "history" as const },
  { label: "Reports", href: ROUTES.adminReports, icon: "reports" as const },
  { label: "Ledger", href: ROUTES.adminLedger, icon: "ledger" as const },
  { label: "Hierarchy", href: ROUTES.adminHierarchy, icon: "hierarchy" as const },
  { label: "Profile", href: ROUTES.adminProfile, icon: "profile" as const },
  { label: "Change Password", href: ROUTES.adminChangePassword, icon: "profile" as const },
] as const;

export const DEMO_CREDENTIALS = [
  { role: "Super Admin", mobile: "9999999999", password: "admin123" },
  { role: "Admin", mobile: "8888888888", password: "admin123" },
  { role: "Master Distributor", mobile: "7777777777", password: "admin123" },
  { role: "Distributor", mobile: "6666666666", password: "admin123" },
  { role: "Retailer", mobile: "5555555555", password: "admin123" },
];

export const GRADIENT_CARDS = [
  "from-[#4318FF] to-[#868CFF]",
  "from-[#6AD2FF] to-[#0085FF]",
  "from-[#05CD99] to-[#00B087]",
  "from-[#FFB547] to-[#FF8F0D]",
  "from-[#E31A1A] to-[#FF6B6B]",
  "from-[#7551FF] to-[#3311DB]",
  "from-[#39B8FF] to-[#2B32B2]",
  "from-[#FF947A] to-[#F2709C]",
];

export const STATUS_COLORS = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  suspended: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};
