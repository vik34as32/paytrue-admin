export type WalletCategoryLedgerType =
  | "users"
  | "main"
  | "commission"
  | "aeps"
  | "hold"
  | "frozen";

export const WALLET_CATEGORY_LEDGER_TYPES: WalletCategoryLedgerType[] = [
  "users",
  "main",
  "commission",
  "aeps",
  "hold",
  "frozen",
];

export function isWalletCategoryLedgerType(
  value: string | null | undefined
): value is WalletCategoryLedgerType {
  return (
    !!value &&
    (WALLET_CATEGORY_LEDGER_TYPES as string[]).includes(value)
  );
}

export const WALLET_CATEGORY_LEDGER_META: Record<
  WalletCategoryLedgerType,
  { title: string; subtitle: string; amountLabel: string }
> = {
  users: {
    title: "Total Users Ledger",
    subtitle: "User details with outlet, PAN and Aadhaar. Filter by role.",
    amountLabel: "Total Balance",
  },
  main: {
    title: "Main Wallet Ledger",
    subtitle: "Users and their main wallet balances.",
    amountLabel: "Main Wallet",
  },
  commission: {
    title: "Commission Wallet Ledger",
    subtitle: "Users and their commission wallet balances.",
    amountLabel: "Commission Wallet",
  },
  aeps: {
    title: "AEPS Wallet Ledger",
    subtitle: "Users and their AEPS wallet balances.",
    amountLabel: "AEPS Wallet",
  },
  hold: {
    title: "Hold Amount Ledger",
    subtitle: "Hold ledger from GET /wallet/hold/ledger (Super Admin).",
    amountLabel: "Hold Balance",
  },
  frozen: {
    title: "Frozen Amount Ledger",
    subtitle: "Freeze ledger from GET /wallet/freeze/ledger (Super Admin).",
    amountLabel: "Frozen Amount",
  },
};
