import { FintechService } from "@/types/commission";

/** All supported fintech services — extend this list for future services */
export const FINTECH_SERVICES: FintechService[] = [
  { id: "aeps_cw", name: "AEPS Cash Withdrawal", code: "AEPS_CW", category: "AEPS" },
  { id: "aeps_be", name: "AEPS Balance Enquiry", code: "AEPS_BE", category: "AEPS" },
  { id: "mini_statement", name: "Mini Statement", code: "MINI_STMT", category: "AEPS" },
  { id: "aadhaar_pay", name: "Aadhaar Pay", code: "AADHAAR_PAY", category: "AEPS" },
  { id: "cash_deposit", name: "Cash Deposit", code: "CASH_DEP", category: "Banking" },
  { id: "dmt", name: "DMT", code: "DMT", category: "Money Transfer" },
  { id: "dmt2", name: "DMT2", code: "DMT2", category: "Money Transfer" },
  { id: "imps", name: "IMPS", code: "IMPS", category: "Money Transfer" },
  { id: "neft", name: "NEFT", code: "NEFT", category: "Money Transfer" },
  { id: "rtgs", name: "RTGS", code: "RTGS", category: "Money Transfer" },
  { id: "upi", name: "UPI", code: "UPI", category: "Payments" },
  { id: "recharge", name: "Recharge", code: "RECHARGE", category: "BBPS" },
  { id: "bbps", name: "BBPS", code: "BBPS", category: "BBPS" },
  { id: "cms", name: "CMS", code: "CMS", category: "Banking" },
  { id: "matm", name: "MATM", code: "MATM", category: "ATM" },
  { id: "micro_atm", name: "Micro ATM", code: "MICRO_ATM", category: "ATM" },
  { id: "cc_bill", name: "Credit Card Bill", code: "CC_BILL", category: "BBPS" },
  { id: "loan_repay", name: "Loan Repayment", code: "LOAN_REPAY", category: "BBPS" },
  { id: "insurance", name: "Insurance", code: "INSURANCE", category: "BBPS" },
  { id: "travel", name: "Travel", code: "TRAVEL", category: "Services" },
  { id: "pan", name: "PAN", code: "PAN", category: "Services" },
  { id: "fastag", name: "FASTag", code: "FASTAG", category: "BBPS" },
  { id: "wallet_load", name: "Wallet Load", code: "WALLET_LOAD", category: "Wallet" },
  { id: "wallet_transfer", name: "Wallet Transfer", code: "WALLET_XFER", category: "Wallet" },
  { id: "payout", name: "Payout", code: "PAYOUT", category: "Payments" },
  { id: "collection", name: "Collection", code: "COLLECTION", category: "Payments" },
  { id: "qr", name: "QR", code: "QR", category: "Payments" },
  { id: "payment_gateway", name: "Payment Gateway", code: "PG", category: "Payments" },
];

export const COMMISSION_TYPE_OPTIONS = [
  { value: "percentage" as const, label: "Percentage", suffix: "%" },
  { value: "flat" as const, label: "Flat Amount", suffix: "₹" },
];

export const COMMISSION_STATUS_OPTIONS = [
  { value: "active" as const, label: "Active" },
  { value: "inactive" as const, label: "Inactive" },
];

export const COMMISSION_SCOPE_OPTIONS = [
  { value: "global" as const, label: "Global" },
  { value: "retailer" as const, label: "Retailer Wise" },
  { value: "distributor" as const, label: "Distributor Wise" },
  { value: "master_distributor" as const, label: "Master Distributor Wise" },
];
