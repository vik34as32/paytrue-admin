import type {
  PermissionModuleDef,
  PermissionRoleType,
} from "@/types/permissions";

export const PERMISSION_ROLE_OPTIONS: {
  value: PermissionRoleType;
  label: string;
}[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "MASTER_DISTRIBUTOR", label: "Master Distributor" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "RETAILER", label: "Retailer" },
];

export const PERMISSION_STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "ENABLED", label: "Enabled" },
  { value: "DISABLED", label: "Disabled" },
] as const;

const ALL_ROLES: PermissionRoleType[] = [
  "ADMIN",
  "MASTER_DISTRIBUTOR",
  "DISTRIBUTOR",
  "RETAILER",
];

type RoleScope = PermissionRoleType[] | "ALL";

export interface ScopedPermissionItem {
  slug: string;
  label: string;
  description?: string;
  /** Who can receive this permission. "ALL" = common. */
  roles: RoleScope;
}

export interface ScopedPermissionModule {
  key: string;
  label: string;
  description?: string;
  /** Module visibility. "ALL" = shown for every role. */
  roles: RoleScope;
  /** UI section: common vs role-specific */
  section: "common" | "role";
  permissions: ScopedPermissionItem[];
}

function p(
  slug: string,
  label: string,
  roles: RoleScope = "ALL",
  description?: string
): ScopedPermissionItem {
  return { slug, label, roles, description };
}

/**
 * Full fintech permission catalog.
 * - section "common" → shared across roles (filtered by item.roles)
 * - section "role" → role-specific feature toggles
 */
export const PERMISSION_CATALOG: ScopedPermissionModule[] = [
  // ===================== COMMON =====================
  {
    key: "common_dashboard",
    label: "Dashboard",
    description: "Common dashboard access",
    roles: "ALL",
    section: "common",
    permissions: [p("dashboard.view", "View Dashboard")],
  },
  {
    key: "common_wallet",
    label: "Wallet (Common)",
    description: "Basic wallet access for every role",
    roles: "ALL",
    section: "common",
    permissions: [
      p("wallet.view", "View Wallet"),
      p("wallet.history", "Wallet History"),
      p("wallet.ledger", "Ledger"),
    ],
  },
  {
    key: "common_profile",
    label: "Profile",
    description: "Profile & security",
    roles: "ALL",
    section: "common",
    permissions: [
      p("profile.view", "View Profile"),
      p("profile.update", "Update Profile"),
      p("profile.change_password", "Change Password"),
    ],
  },
  {
    key: "common_fund_request",
    label: "Fund Request (Common)",
    description: "Shared fund request actions",
    roles: "ALL",
    section: "common",
    permissions: [
      p("fund_request.view", "View Fund Requests"),
      p("fund_request.create", "Create Fund Request", [
        "MASTER_DISTRIBUTOR",
        "DISTRIBUTOR",
        "RETAILER",
      ]),
    ],
  },
  {
    key: "common_reports",
    label: "Reports & History",
    description: "Reporting and activity history",
    roles: "ALL",
    section: "common",
    permissions: [
      p("reports.view", "View Reports", [
        "ADMIN",
        "MASTER_DISTRIBUTOR",
        "DISTRIBUTOR",
      ]),
      p("history.view", "View History"),
      p("uploads.create", "Upload Documents"),
    ],
  },
  {
    key: "common_login_methods",
    label: "Login With",
    description: "Enable or disable login methods for this user",
    roles: "ALL",
    section: "common",
    permissions: [
      p("login.password", "Login with Password"),
      p("login.otp", "Login with OTP"),
      p("login.email", "Login with Email"),
      p("login.biometric", "Login with Biometric"),
    ],
  },
  {
    key: "common_notifications",
    label: "Notifications & Email",
    description: "Push notification and email service channels",
    roles: "ALL",
    section: "common",
    permissions: [
      p("notification.push", "Push Notification"),
      p("notification.email", "Email Service"),
    ],
  },

  // ===================== ADMIN =====================
  {
    key: "admin_users",
    label: "User Management",
    description: "Create and manage network users",
    roles: ["ADMIN"],
    section: "role",
    permissions: [
      p("users.view", "View Users", ["ADMIN"]),
      p("users.create", "Create Users", ["ADMIN"]),
      p("users.update", "Update Users", ["ADMIN"]),
      p("users.delete", "Delete Users", ["ADMIN"]),
      p("hierarchy.view", "View Hierarchy", ["ADMIN"]),
    ],
  },
  {
    key: "admin_wallet",
    label: "Admin Wallet Operations",
    description: "Transfer / deduct / summary",
    roles: ["ADMIN"],
    section: "role",
    permissions: [
      p("wallet.transfer", "Wallet Transfer", ["ADMIN"]),
      p("wallet.debit", "Wallet Deduct / Debit", ["ADMIN"]),
      p("wallet.credit", "Wallet Credit", ["ADMIN"]),
      p("wallet.summary", "Wallet Summary", ["ADMIN"]),
    ],
  },
  {
    key: "admin_fund",
    label: "Fund Request Approval",
    description: "Approve or reject network fund requests",
    roles: ["ADMIN"],
    section: "role",
    permissions: [
      p("fund_request.approve", "Approve Fund Request", ["ADMIN"]),
      p("fund_request.reject", "Reject Fund Request", ["ADMIN"]),
    ],
  },
  {
    key: "admin_bank",
    label: "Bank Accounts",
    description: "Assign system bank accounts to users",
    roles: ["ADMIN"],
    section: "role",
    permissions: [
      p("bank_accounts.view", "View Bank Accounts", ["ADMIN"]),
      p("bank_accounts.assign", "Assign Bank Account", ["ADMIN"]),
    ],
  },
  {
    key: "admin_commission",
    label: "Commission Management",
    description: "RT / DD / MD commission slabs",
    roles: ["ADMIN"],
    section: "role",
    permissions: [
      p("commission.view", "View Commission", ["ADMIN"]),
      p("commission.create", "Create Commission", ["ADMIN"]),
      p("commission.update", "Update Commission", ["ADMIN"]),
      p("commission.delete", "Delete Commission", ["ADMIN"]),
    ],
  },
  {
    key: "admin_services",
    label: "Service Master",
    description: "Enable/disable fintech services",
    roles: ["ADMIN"],
    section: "role",
    permissions: [
      p("service_master.view", "View Service Master", ["ADMIN"]),
      p("service_master.create", "Create Service", ["ADMIN"]),
      p("service_master.update", "Update Service", ["ADMIN"]),
      p("service_master.delete", "Delete Service", ["ADMIN"]),
    ],
  },

  // ===================== MASTER DISTRIBUTOR =====================
  {
    key: "md_network",
    label: "Network Management",
    description: "Manage distributors and retailers under MD",
    roles: ["MASTER_DISTRIBUTOR"],
    section: "role",
    permissions: [
      p("users.view", "View Downline Users", ["MASTER_DISTRIBUTOR"]),
      p("users.create", "Create Downline Users", ["MASTER_DISTRIBUTOR"]),
      p("users.update", "Update Downline Users", ["MASTER_DISTRIBUTOR"]),
      p("hierarchy.view", "View Hierarchy", ["MASTER_DISTRIBUTOR"]),
    ],
  },
  {
    key: "md_wallet",
    label: "MD Wallet Operations",
    description: "Transfer balance to distributors / retailers",
    roles: ["MASTER_DISTRIBUTOR"],
    section: "role",
    permissions: [
      p("wallet.transfer", "Wallet Transfer", ["MASTER_DISTRIBUTOR"]),
      p("wallet.summary", "Wallet Summary", ["MASTER_DISTRIBUTOR"]),
    ],
  },
  {
    key: "md_fund",
    label: "MD Fund Request Actions",
    description: "Approve downline fund requests",
    roles: ["MASTER_DISTRIBUTOR"],
    section: "role",
    permissions: [
      p("fund_request.approve", "Approve Fund Request", [
        "MASTER_DISTRIBUTOR",
      ]),
      p("fund_request.reject", "Reject Fund Request", [
        "MASTER_DISTRIBUTOR",
      ]),
    ],
  },
  {
    key: "md_transactions",
    label: "Transactions & Reports",
    description: "MD reporting suite",
    roles: ["MASTER_DISTRIBUTOR"],
    section: "role",
    permissions: [
      p("transactions.view", "View Transactions", ["MASTER_DISTRIBUTOR"]),
      p("ledger.view", "View Ledger", ["MASTER_DISTRIBUTOR"]),
    ],
  },

  // ===================== DISTRIBUTOR =====================
  {
    key: "dd_network",
    label: "Retailer Management",
    description: "Manage retailers under distributor",
    roles: ["DISTRIBUTOR"],
    section: "role",
    permissions: [
      p("users.view", "View Retailers", ["DISTRIBUTOR"]),
      p("users.create", "Create Retailers", ["DISTRIBUTOR"]),
      p("users.update", "Update Retailers", ["DISTRIBUTOR"]),
      p("hierarchy.view", "View Hierarchy", ["DISTRIBUTOR"]),
    ],
  },
  {
    key: "dd_wallet",
    label: "Distributor Wallet Operations",
    description: "Transfer balance to retailers",
    roles: ["DISTRIBUTOR"],
    section: "role",
    permissions: [
      p("wallet.transfer", "Wallet Transfer", ["DISTRIBUTOR"]),
      p("wallet.summary", "Wallet Summary", ["DISTRIBUTOR"]),
    ],
  },
  {
    key: "dd_fund",
    label: "Distributor Fund Request Actions",
    description: "Approve retailer fund requests",
    roles: ["DISTRIBUTOR"],
    section: "role",
    permissions: [
      p("fund_request.approve", "Approve Fund Request", ["DISTRIBUTOR"]),
      p("fund_request.reject", "Reject Fund Request", ["DISTRIBUTOR"]),
    ],
  },
  {
    key: "dd_transactions",
    label: "Transactions",
    description: "Distributor transaction views",
    roles: ["DISTRIBUTOR"],
    section: "role",
    permissions: [
      p("transactions.view", "View Transactions", ["DISTRIBUTOR"]),
      p("ledger.view", "View Ledger", ["DISTRIBUTOR"]),
    ],
  },

  // ===================== RETAILER / FINTECH SERVICES =====================
  {
    key: "rt_aeps",
    label: "AEPS",
    description: "Aadhaar Enabled Payment System",
    roles: ["RETAILER"],
    section: "role",
    permissions: [
      p("aeps.cash_withdrawal", "Cash Withdrawal", ["RETAILER"]),
      p("aeps.cash_deposit", "Cash Deposit", ["RETAILER"]),
      p("aeps.balance_enquiry", "Balance Enquiry", ["RETAILER"]),
      p("aeps.mini_statement", "Mini Statement", ["RETAILER"]),
      p("aeps.aadhaar_pay", "Aadhaar Pay", ["RETAILER"]),
      p("aeps.login", "AEPS Login / Bio Auth", ["RETAILER"]),
    ],
  },
  {
    key: "rt_dmt",
    label: "DMT",
    description: "Domestic Money Transfer",
    roles: ["RETAILER"],
    section: "role",
    permissions: [
      p("dmt.register_sender", "Register Sender", ["RETAILER"]),
      p("dmt.add_beneficiary", "Add Beneficiary", ["RETAILER"]),
      p("dmt.imps_transfer", "IMPS Transfer", ["RETAILER"]),
      p("dmt.neft_transfer", "NEFT Transfer", ["RETAILER"]),
      p("dmt.transaction_status", "Transaction Status", ["RETAILER"]),
      p("dmt.refund", "DMT Refund", ["RETAILER"]),
    ],
  },
  {
    key: "rt_upi_atm",
    label: "UPI ATM",
    description: "UPI ATM cash-out",
    roles: ["RETAILER"],
    section: "role",
    permissions: [
      p("upi_atm.qr_generate", "QR Generate", ["RETAILER"]),
      p("upi_atm.transaction", "Transaction", ["RETAILER"]),
      p("upi_atm.history", "UPI ATM History", ["RETAILER"]),
    ],
  },
  {
    key: "rt_recharge",
    label: "Recharge",
    description: "Mobile / DTH / FASTag recharge",
    roles: ["RETAILER"],
    section: "role",
    permissions: [
      p("recharge.mobile", "Mobile Recharge", ["RETAILER"]),
      p("recharge.dth", "DTH Recharge", ["RETAILER"]),
      p("recharge.fastag", "FASTag Recharge", ["RETAILER"]),
      p("recharge.postpaid", "Postpaid Bill", ["RETAILER"]),
    ],
  },
  {
    key: "rt_bbps",
    label: "BBPS",
    description: "Bharat Bill Payment System",
    roles: ["RETAILER"],
    section: "role",
    permissions: [
      p("bbps.electricity", "Electricity", ["RETAILER"]),
      p("bbps.gas", "Gas", ["RETAILER"]),
      p("bbps.water", "Water", ["RETAILER"]),
      p("bbps.broadband", "Broadband", ["RETAILER"]),
      p("bbps.landline", "Landline", ["RETAILER"]),
      p("bbps.lpg", "LPG", ["RETAILER"]),
      p("bbps.insurance", "Insurance Bill", ["RETAILER"]),
    ],
  },
  {
    key: "rt_matm",
    label: "mATM / Micro ATM",
    description: "Micro ATM / mATM services",
    roles: ["RETAILER"],
    section: "role",
    permissions: [
      p("matm.cash_withdrawal", "mATM Cash Withdrawal", ["RETAILER"]),
      p("matm.balance_enquiry", "mATM Balance Enquiry", ["RETAILER"]),
      p("micro_atm.transaction", "Micro ATM Transaction", ["RETAILER"]),
    ],
  },
  {
    key: "rt_other_services",
    label: "Other Fintech Services",
    description: "PAN, CMS, Travel, Insurance, Payout, UPI & more",
    roles: ["RETAILER"],
    section: "role",
    permissions: [
      p("pan.apply", "PAN Card Apply", ["RETAILER"]),
      p("cms.deposit", "CMS Deposit", ["RETAILER"]),
      p("travel.book", "Travel Booking", ["RETAILER"]),
      p("insurance.purchase", "Insurance Purchase", ["RETAILER"]),
      p("credit_card.bill_pay", "Credit Card Bill Pay", ["RETAILER"]),
      p("loan.repay", "Loan Repayment", ["RETAILER"]),
      p("payout.bank_transfer", "Payout / Bank Transfer", ["RETAILER"]),
      p("upi.collect", "UPI Collection", ["RETAILER"]),
      p("upi.qr", "UPI QR", ["RETAILER"]),
      p("aadhaar.services", "Aadhaar Services", ["RETAILER"]),
      p("services.catalog", "View Service Catalog", ["RETAILER"]),
    ],
  },
];

function roleAllowed(scope: RoleScope, role: PermissionRoleType): boolean {
  if (scope === "ALL") return true;
  return scope.includes(role);
}

/** Modules visible for a role (common + that role’s specific modules). */
export function getPermissionModulesForRole(
  role: PermissionRoleType
): PermissionModuleDef[] {
  return PERMISSION_CATALOG.filter((module) =>
    roleAllowed(module.roles, role)
  )
    .map((module) => {
      const permissions = module.permissions
        .filter((item) => roleAllowed(item.roles, role))
        .map(({ slug, label, description }) => ({ slug, label, description }));
      return {
        key: module.key,
        label: module.label,
        description: module.description,
        permissions,
        section: module.section,
      } satisfies PermissionModuleDef & { section: "common" | "role" };
    })
    .filter((module) => module.permissions.length > 0);
}

/** @deprecated use getPermissionModulesForRole — kept for callers without role */
export const PERMISSION_MODULES: PermissionModuleDef[] =
  getPermissionModulesForRole("RETAILER");

export function getAllPermissionSlugs(
  modules: PermissionModuleDef[]
): string[] {
  return modules.flatMap((module) =>
    module.permissions.map((permission) => permission.slug)
  );
}

export function getModuleOptionsForRole(role: PermissionRoleType) {
  const modules = getPermissionModulesForRole(role);
  return [
    { value: "", label: "All Modules" },
    ...modules.map((module) => ({
      value: module.key,
      label: module.label,
    })),
  ];
}

/** Sensible defaults when a user has no saved permissions yet. */
export function getDefaultEnabledSlugs(role: PermissionRoleType): string[] {
  const modules = getPermissionModulesForRole(role);
  const all = getAllPermissionSlugs(modules);

  switch (role) {
    case "ADMIN":
      return all.filter(
        (slug) =>
          slug !== "wallet.credit" &&
          slug !== "service_master.delete" &&
          slug !== "users.delete"
      );
    case "MASTER_DISTRIBUTOR":
      return all.filter(
        (slug) =>
          slug !== "fund_request.reject" && slug !== "users.update"
      );
    case "DISTRIBUTOR":
      return all.filter(
        (slug) =>
          slug !== "fund_request.reject" && slug !== "users.update"
      );
    case "RETAILER":
      return [
        "dashboard.view",
        "wallet.view",
        "wallet.history",
        "wallet.ledger",
        "profile.view",
        "profile.update",
        "profile.change_password",
        "fund_request.view",
        "fund_request.create",
        "history.view",
        "login.password",
        "login.otp",
        "notification.push",
        "notification.email",
        "aeps.cash_withdrawal",
        "aeps.balance_enquiry",
        "dmt.register_sender",
        "dmt.add_beneficiary",
        "dmt.imps_transfer",
        "dmt.transaction_status",
        "upi_atm.qr_generate",
        "recharge.mobile",
        "recharge.dth",
        "bbps.electricity",
        "services.catalog",
      ].filter((slug) => all.includes(slug));
    default:
      return [];
  }
}

export { ALL_ROLES };
