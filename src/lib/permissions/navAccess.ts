import { ROUTES } from "@/constants";

const ALWAYS_VISIBLE_HREFS = new Set<string>([
  ROUTES.adminDashboard,
  ROUTES.superAdminDashboard,
  ROUTES.dashboard,
]);

const HREF_KEY_HINTS: { href: string; hints: string[] }[] = [
  { href: ROUTES.adminWalletManagement, hints: ["WALLET"] },
  { href: ROUTES.adminWallets, hints: ["WALLET"] },
  { href: ROUTES.adminWalletSummary, hints: ["WALLET"] },
  { href: ROUTES.adminWalletLedger, hints: ["WALLET", "LEDGER"] },
  { href: ROUTES.adminBalanceTransfer, hints: ["WALLET", "TRANSFER", "BALANCE"] },
  { href: ROUTES.adminBalanceDeduct, hints: ["WALLET", "TRANSFER", "BALANCE"] },
  { href: ROUTES.adminCommissionManagement, hints: ["COMMISSION"] },
  { href: ROUTES.adminFundRequests, hints: ["FUND"] },
  { href: ROUTES.adminReports, hints: ["REPORT"] },
  { href: ROUTES.adminHistory, hints: ["HISTORY", "WALLET"] },
  { href: ROUTES.adminAssignBankAccount, hints: ["BANK"] },
  { href: ROUTES.adminHierarchy, hints: ["HIERARCHY", "NETWORK"] },
  { href: ROUTES.hierarchyManagement, hints: ["HIERARCHY", "NETWORK"] },
  { href: ROUTES.adminMasterDistributor, hints: ["NETWORK", "USER", "ADMIN"] },
  { href: ROUTES.adminDistributors, hints: ["NETWORK", "USER", "ADMIN"] },
  { href: ROUTES.adminRetailers, hints: ["NETWORK", "USER", "ADMIN"] },
];

export function matchesPermissionHint(
  value: string,
  hints: string[]
): boolean {
  const haystack = value.toUpperCase();
  return hints.some((hint) => haystack.includes(hint.toUpperCase()));
}

export function isNavAlwaysVisible(href: string): boolean {
  return ALWAYS_VISIBLE_HREFS.has(href);
}

export function isHrefGranted(
  href: string,
  permissionKeys: string[]
): boolean {
  if (isNavAlwaysVisible(href)) return true;
  const mapping = HREF_KEY_HINTS.find((item) => item.href === href);
  if (!mapping) return true;
  return permissionKeys.some((key) =>
    matchesPermissionHint(key, mapping.hints)
  );
}

export function serviceTypeGranted(
  serviceType: string,
  permissionKeys: string[],
  grantedTypes: string[]
): boolean {
  const type = serviceType.toUpperCase();
  if (grantedTypes.some((item) => item.toUpperCase() === type)) return true;
  const compact = type.replace(/\s+/g, "_");
  return permissionKeys.some(
    (key) =>
      key.toUpperCase().startsWith(`${compact}_`) ||
      key.toUpperCase().includes(compact)
  );
}
