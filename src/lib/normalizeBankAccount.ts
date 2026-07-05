import { BankAccountRecord } from "@/types/bankAccount";

export function normalizeBankAccountRecord(
  raw: Record<string, unknown>
): BankAccountRecord {
  const status =
    (raw.status as string | undefined) ||
    (raw.isActive === true ? "ACTIVE" : raw.isActive === false ? "INACTIVE" : undefined);

  return {
    id: String(raw.id || raw._id || ""),
    accountHolderName: String(
      raw.accountHolderName || raw.holderName || raw.account_holder_name || ""
    ),
    bankName: String(raw.bankName || raw.bank_name || ""),
    accountNumber: String(
      raw.accountNumber || raw.account_number || raw.bankAccountNumber || ""
    ),
    ifscCode: String(raw.ifscCode || raw.ifsc || raw.ifsc_code || "").toUpperCase(),
    branchName: (raw.branchName || raw.branch_name) as string | undefined,
    upiId: (raw.upiId || raw.upi_id) as string | undefined,
    status,
    isActive:
      raw.isActive !== undefined
        ? Boolean(raw.isActive)
        : status
          ? status.toUpperCase() === "ACTIVE"
          : undefined,
    createdAt: raw.createdAt as string | undefined,
    updatedAt: raw.updatedAt as string | undefined,
    deletedAt: raw.deletedAt as string | null | undefined,
  };
}
