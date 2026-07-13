import { WalletBalanceData } from "@/types/superAdmin";
import { parseWalletAmount } from "@/lib/walletAmount";

const SKIP_KEYS = new Set([
  "lastUpdated",
  "updatedAt",
  "createdAt",
  "id",
  "userId",
  "adminId",
  "currency",
  "status",
]);

const BALANCE_PRIORITY = [
  "walletBalance",
  "balance",
  "availableBalance",
  "totalBalance",
  "currentBalance",
  "virtualBalance",
] as const;

/** Convert camelCase API keys to readable card titles */
export function formatBalanceFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

const BALANCE_FIELD_KEYS = new Set([
  "walletBalance",
  "balance",
  "availableBalance",
  "totalBalance",
  "currentBalance",
  "virtualBalance",
]);

/** Build stat cards — wallet balance shown once; other numeric fields if different. */
export function buildDynamicBalanceCards(
  data: WalletBalanceData | null
): { key: string; title: string; value: number }[] {
  if (!data) return [];

  const primaryBalance = resolvePrimaryBalance(data);
  const cards: { key: string; title: string; value: number }[] = [
    {
      key: "walletBalance",
      title: "Wallet Balance",
      value: primaryBalance,
    },
  ];

  const seenValues = new Set([primaryBalance]);

  for (const [key, value] of Object.entries(data)) {
    if (SKIP_KEYS.has(key) || BALANCE_FIELD_KEYS.has(key)) continue;

    const parsed = parseWalletAmount(value);
    if (parsed === undefined || seenValues.has(parsed)) continue;

    seenValues.add(parsed);
    cards.push({
      key,
      title: formatBalanceFieldLabel(key),
      value: parsed,
    });
  }

  return cards;
}

export function resolvePrimaryBalance(data: WalletBalanceData | null): number {
  if (!data) return 0;

  for (const key of BALANCE_PRIORITY) {
    const val = parseWalletAmount(data[key]);
    if (val !== undefined) return val;
  }

  const first = buildDynamicBalanceCards(data)[0];
  return first?.value ?? 0;
}

export function normalizeWalletBalanceData(
  payload: unknown
): WalletBalanceData {
  if (!payload || typeof payload !== "object") {
    return { balance: 0, walletBalance: 0 };
  }

  const obj = payload as Record<string, unknown>;
  const source =
    obj.wallet && typeof obj.wallet === "object"
      ? (obj.wallet as Record<string, unknown>)
      : obj;

  const balance =
    parseWalletAmount(source.balance) ??
    parseWalletAmount(source.walletBalance) ??
    parseWalletAmount(source.availableBalance) ??
    parseWalletAmount(source.virtualBalance) ??
    parseWalletAmount(source.totalBalance) ??
    0;

  const normalized: WalletBalanceData = {
    ...(source as WalletBalanceData),
    balance,
    walletBalance:
      parseWalletAmount(source.walletBalance) ??
      parseWalletAmount(source.balance) ??
      balance,
  };

  for (const key of Object.keys(source)) {
    const parsed = parseWalletAmount(source[key]);
    if (parsed !== undefined) {
      normalized[key] = parsed;
    }
  }

  return normalized;
}
