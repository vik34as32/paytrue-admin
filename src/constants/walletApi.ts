/** Wallet module routes — registered at prefix `/api/v1/wallet` */
export const WALLET_API = {
  balance: "/wallet",
  transfer: "/wallet/transfer",
  deduct: "/wallet/deduct",
  transfers: "/wallet/transfers",
  /** GET `/wallet/summary/:userId` — Admin / Super Admin user wallet activity */
  summary: "/wallet/summary",
} as const;

/** Super Admin module — prefix `/api/v1/super-admin` */
export const SUPER_ADMIN_WALLET_API = {
  balance: "/wallet-balance",
} as const;
