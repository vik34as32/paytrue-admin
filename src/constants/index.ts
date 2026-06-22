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
  admin: "/admin",
  masterDistributor: "/master-distributor",
  distributor: "/distributor",
  retailer: "/retailer",
} as const;

export const SIDEBAR_ITEMS = [
  { label: "Dashboard", href: ROUTES.dashboard, icon: "dashboard" },
  { label: "Users", href: ROUTES.users, icon: "users" },
  { label: "Transactions", href: ROUTES.transactions, icon: "transactions" },
  { label: "Balance Transfer", href: ROUTES.balanceTransfer, icon: "transfer" },
  { label: "Request Management", href: ROUTES.requests, icon: "requests" },
  { label: "Reports", href: ROUTES.reports, icon: "reports" },
  { label: "Ledger", href: ROUTES.ledger, icon: "ledger" },
  { label: "Hierarchy", href: ROUTES.hierarchy, icon: "hierarchy" },
  { label: "History", href: ROUTES.history, icon: "history" },
  { label: "Profile", href: ROUTES.profile, icon: "profile" },
  { label: "Settings", href: ROUTES.settings, icon: "settings" },
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
