/** Hover copy for sidebar + page headers. Longest matching path wins. */

export const SECTION_HELP: Record<string, string> = {
  "/super-admin/dashboard":
    "Command center for Super Admin — live wallet, network health, and the actions that need attention today.",
  "/super-admin/statistics":
    "Business analytics: volume, success mix, and service-wise trends so you can steer the network with numbers, not guesswork.",
  "/super-admin/admins":
    "Create and manage Admin users who operate a slice of the network under your control.",
  "/super-admin/create-admin":
    "Onboard a new Admin with credentials, limits, and the services they are allowed to run.",
  "/super-admin/master-distributors":
    "Master Distributor directory — KYC, status, and the downline they control.",
  "/super-admin/distributors":
    "Distributor directory — parent mapping, wallet posture, and activation status.",
  "/super-admin/retailers":
    "Retailer (outlet) directory — the last-mile agents who run AEPS, DMT, and other services.",
  "/super-admin/fund-requests":
    "Incoming wallet top-up requests. Approve or reject after matching the bank credit.",
  "/super-admin/logs":
    "Provider error logs: failed NIFI / InstantPay / Finzeng API calls only. Use this to debug timeouts, HTTP errors, and provider outages — successes are never stored. Records auto-expire after 7 days.",
  "/super-admin/bank-accounts":
    "Company collection accounts shown to the network for fund requests. Keep IFSC and account numbers accurate.",
  "/super-admin/service-charges":
    "Fee plans applied on services (AEPS, DMT, etc.). Changes here affect what the network pays per transaction.",
  "/sa/aeps-ledger":
    "AEPS settlement ledger — previous balance, tax, charge, commission, account, and bank for each AEPS movement.",
  "/super-admin/permissions":
    "Permission Management — grant or lock AUTH, wallet, and service modules per Admin so they only see what they are allowed to run.",
  "/super-admin/permission-management":
    "Permission Management — grant or lock AUTH, wallet, and service modules per Admin.",
  "/admin/service-master":
    "Service Master — turn products on/off and keep provider mapping in one place.",
  "/super-admin/transfer-balance":
    "Credit wallet balance down the hierarchy (Admin / MD / DT / RT) with a clear audit trail.",
  "/super-admin/deduct-balance":
    "Recover or reverse wallet funds when a credit was excess, disputed, or needs adjustment.",
  "/super-admin/add-balance":
    "Load the Super Admin virtual wallet that funds the rest of the network.",
  "/admin/commission-management":
    "Commission slabs by service and role. This is what partners earn on successful business.",
  "/super-admin/wallet-history":
    "Virtual wallet credit/debit history for Super Admin — every load and payout in one timeline.",
  "/super-admin/wallet-summary":
    "Who sent money to whom — From / To with name and phone, plus amount and running balances.",
  "/super-admin/statements":
    "Service-wise business reports and statements you can filter, print, and share with the client.",
  "/super-admin/wallet-management":
    "Search any user wallet, freeze/hold, transfer, deduct, and open category ledgers.",
  "/super-admin/wallet-ledger":
    "Wallet ledger for a selected user — every credit, debit, tax, and charge in order.",
  "/super-admin/wallet-lien":
    "Place or release a lien (blocked amount) on a wallet without a full freeze.",
  "/super-admin/id-verification":
    "Review KYC documents and approve or reject identity proofs before activating an outlet.",
  "/super-admin/change-password":
    "Update the Super Admin login password. Use a strong unique password.",
  "/hierarchy":
    "Read-only org chart of Admin → MD → Distributor → Retailer.",
  "/hierarchy-management":
    "Reassign distributors and retailers when a parent changes, without losing wallet history.",
  "/admin/dashboard":
    "Admin home — your wallet, downline snapshot, and pending fund requests.",
  "/admin/master-distributor":
    "Master Distributors created under this Admin.",
  "/admin/distributors":
    "Distributors in your tree — create, edit, and track activation.",
  "/admin/retailers":
    "Retailers (outlets) reporting to your distributors.",
  "/admin/balance-transfer":
    "Push wallet balance to an MD, Distributor, or Retailer in your hierarchy.",
  "/admin/balance-deduct":
    "Pull back wallet funds from a user in your tree with a recorded reason.",
  "/admin/wallet-summary":
    "From / To wallet movements for users you manage.",
  "/admin/wallet-management":
    "Operate wallets in your network: view, transfer, deduct, freeze.",
  "/admin/bank-account-assign":
    "Map which company bank account a partner should deposit against.",
  "/admin/requests":
    "Fund requests from your downline waiting for approval.",
  "/admin/history":
    "Your own wallet movement history.",
  "/admin/reports":
    "Business reports for the Admin portal — service mix and settlement views.",
  "/admin/wallet-ledger":
    "Detailed wallet ledger for a selected user under this Admin.",
  "/admin/hierarchy":
    "Your portion of the PayTrue network tree.",
  "/admin/profile":
    "Admin profile and contact details.",
  "/admin/change-password":
    "Change the Admin login password.",
  "/admin/wallets":
    "Wallet overview for the signed-in Admin.",
  "/dashboard":
    "Your role home — balances, recent activity, and shortcuts.",
  "/wallets":
    "Your live wallet balances across service categories.",
  "/transactions":
    "Transaction list for the services you operate.",
  "/balance-transfer":
    "Send wallet funds to a user you are allowed to credit.",
  "/requests":
    "Raise or review fund requests in the approval chain.",
  "/reports":
    "Business reports for your role.",
  "/ledger":
    "Ledger of credits and debits against your wallet.",
  "/history":
    "Past wallet and request activity.",
  "/profile":
    "Your profile, contact, and security shortcuts.",
  "/settings":
    "Workspace preferences for this portal.",
  "/users":
    "User directory for this role.",
  "/statments":
    "Retailer service statements and receipts.",
};

export function getSectionHelp(pathname: string): string {
  const keys = Object.keys(SECTION_HELP).sort((a, b) => b.length - a.length);
  const match = keys.find(
    (href) => pathname === href || pathname.startsWith(`${href}/`)
  );
  if (match) return SECTION_HELP[match];
  return "This module holds operational records for the current screen. Use the filters and table below to review, export, and take action.";
}
