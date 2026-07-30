import { z } from "zod";

export const walletFilterSchema = z.object({
  search: z.string().trim().max(100),
  role: z.enum(["", "RETAILER", "DISTRIBUTOR", "MASTER_DISTRIBUTOR", "ADMIN"]),
  status: z.enum(["", "ACTIVE", "INACTIVE", "BLOCKED", "SUSPENDED", "PENDING"]),
  verificationStatus: z.enum(["", "VERIFIED", "PENDING", "REJECTED"]),
  limit: z.number().int().min(10).max(100),
  page: z.number().int().min(1),
  sortBy: z.enum([
    "name",
    "role",
    "mainWallet",
    "commissionWallet",
    "aepsWallet",
    "totalBalance",
    "createdAt",
  ]),
  sortOrder: z.enum(["asc", "desc"]),
});

export type WalletFilterValues = z.infer<typeof walletFilterSchema>;

export const WALLET_ROLE_OPTIONS = [
  { value: "", label: "All" },
  { value: "RETAILER", label: "Retailer" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "MASTER_DISTRIBUTOR", label: "Master Distributor" },
  { value: "ADMIN", label: "Admin" },
] as const;

export const WALLET_STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "BLOCKED", label: "Blocked" },
] as const;

export const WALLET_VERIFICATION_OPTIONS = [
  { value: "", label: "All" },
  { value: "VERIFIED", label: "Verified" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Rejected" },
] as const;

export const WALLET_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
