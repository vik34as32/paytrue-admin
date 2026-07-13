/** Values for Super Admin `/wallet-history` (ADD_BALANCE only) and shared labels */
export const WALLET_TRANSACTION_TYPE = {
  CREDIT: "CREDIT",
  DEBIT: "DEBIT",
  DEDUCT: "DEDUCT",
  TRANSFER: "TRANSFER",
  ADD_BALANCE: "ADD_BALANCE",
} as const;

export type WalletTransactionType =
  (typeof WALLET_TRANSACTION_TYPE)[keyof typeof WALLET_TRANSACTION_TYPE];

/**
 * Prefer `/wallet/transfers` for deduct/transfer lists.
 * Do not send TRANSFER/DEDUCT to `/super-admin/wallet-history`.
 */
export const WALLET_DEDUCT_HISTORY_TYPE = WALLET_TRANSACTION_TYPE.DEDUCT;
