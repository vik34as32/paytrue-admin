import type { WalletDeductInput, WalletDeductPayload } from "@/types/wallet";

/** Parse wallet/amount values from API (number or numeric string). */
export function parseWalletAmount(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Whole rupees only — avoids float issues like 2999.999 → wrong credit. */
export function normalizeTransferAmount(amount: number): number {
  const normalized = Math.round(Number(amount));
  if (!Number.isFinite(normalized) || normalized < 1) {
    throw new Error("Enter a valid whole rupee amount");
  }
  return normalized;
}

export function buildWalletTransferPayload<T extends { amount: number }>(
  payload: T
): T {
  return {
    ...payload,
    amount: normalizeTransferAmount(payload.amount),
  };
}

/** Deduct API expects `userId` (not `receiverId`). */
export function buildWalletDeductPayload(
  payload: WalletDeductInput
): WalletDeductPayload {
  const userId = payload.userId ?? payload.receiverId;
  if (!userId) {
    throw new Error("User is required");
  }

  const normalized = buildWalletTransferPayload({
    amount: payload.amount,
    description: payload.description,
  } as { amount: number; description: string });

  return {
    userId,
    amount: normalized.amount,
    description: payload.description,
  };
}
