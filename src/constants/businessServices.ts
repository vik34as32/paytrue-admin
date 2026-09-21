/** Canonical business report service keys — merge with live Service Master. */
export const BUSINESS_SERVICE_KEYS = [
  { code: "DMT", label: "DMT" },
  { code: "DMT2", label: "DMT2" },
  { code: "DMT3", label: "DMT3" },
  { code: "AEPS", label: "AEPS" },
  { code: "UPI", label: "UPI ATM" },
  { code: "RECHARGE", label: "Recharge" },
  { code: "BBPS", label: "BBPS" },
  { code: "WALLET_TRANSFER", label: "Wallet Transfer" },
  { code: "WALLET_XFER", label: "Wallet Transfer" },
] as const;

export type BusinessServiceCode = (typeof BUSINESS_SERVICE_KEYS)[number]["code"];

export function labelForBusinessService(code: string): string {
  const upper = code.trim().toUpperCase();
  const found = BUSINESS_SERVICE_KEYS.find((item) => item.code === upper);
  if (found) return found.label;
  if (upper === "UPI_ATM" || upper === "UPIATM") return "UPI ATM";
  return code.replace(/_/g, " ");
}
