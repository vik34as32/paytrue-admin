/** Wallet module routes — registered at prefix `/api/v1/wallet` */
export const WALLET_API = {
  balance: "/wallet",
  transfer: "/wallet/transfer",
  deduct: "/wallet/deduct",
  transfers: "/wallet/transfers",
  hold: "/wallet/hold",
  /** GET `/wallet/hold/ledger` — Super Admin hold ledger */
  holdLedger: "/wallet/hold/ledger",
  release: "/wallet/release",
  freeze: "/wallet/freeze",
  /** GET `/wallet/freeze/ledger` — Super Admin freeze ledger */
  freezeLedger: "/wallet/freeze/ledger",
  unfreeze: "/wallet/unfreeze",
  users: "/wallet/users",
  summaries: "/wallet/summaries",
  /** GET `/wallet/summary/:userId` — Admin / Super Admin user wallet activity */
  summary: "/wallet/summary",
} as const;

/** Super Admin module — prefix `/api/v1/super-admin` */
export const SUPER_ADMIN_WALLET_API = {
  balance: "/wallet-balance",
} as const;
