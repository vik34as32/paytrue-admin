import { WalletBalanceData } from "@/types/superAdmin";

const SKIP_KEYS = new Set([
  "lastUpdated",
  "updatedAt",
  "createdAt",
  "id",
  "userId",
  "adminId",
]);

/** Convert camelCase API keys to readable card titles */
export function formatBalanceFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Build stat cards from every numeric field in the live API wallet response */
export function buildDynamicBalanceCards(
  data: WalletBalanceData | null
): { key: string; title: string; value: number }[] {
  if (!data) return [];

  return Object.entries(data)
    .filter(([key, value]) => {
      if (SKIP_KEYS.has(key)) return false;
      return typeof value === "number" && !Number.isNaN(value);
    })
    .map(([key, value]) => ({
      key,
      title: formatBalanceFieldLabel(key),
      value: value as number,
    }));
}

export function resolvePrimaryBalance(data: WalletBalanceData | null): number {
  if (!data) return 0;
  const priority = [
    "walletBalance",
    "balance",
    "availableBalance",
    "totalBalance",
    "currentBalance",
    "virtualBalance",
  ];
  for (const key of priority) {
    const val = data[key];
    if (typeof val === "number" && !Number.isNaN(val)) return val;
  }
  const first = buildDynamicBalanceCards(data)[0];
  return first?.value ?? 0;
}
