import { z } from "zod";
import { BankAccountRecord } from "@/types/bankAccount";

const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const accountNumberRegex = /^\d{9,18}$/;

export const bankAccountFormSchema = z.object({
  accountHolderName: z
    .string()
    .min(2, "Account holder name must be at least 2 characters"),
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z
    .string()
    .min(1, "Account number is required")
    .regex(accountNumberRegex, "Enter a valid 9–18 digit account number"),
  ifscCode: z
    .string()
    .min(1, "IFSC code is required")
    .transform((value) => value.trim().toUpperCase())
    .refine((value) => ifscRegex.test(value), "Enter a valid IFSC code"),
  branchName: z.string().optional(),
  upiId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>;

export const bankAccountEmptyDefaults: BankAccountFormValues = {
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  branchName: "",
  upiId: "",
  status: "ACTIVE",
};

export function mapBankAccountToFormValues(
  account: BankAccountRecord
): BankAccountFormValues {
  const status =
    account.status?.toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE";

  return {
    accountHolderName: account.accountHolderName || "",
    bankName: account.bankName || "",
    accountNumber: account.accountNumber || "",
    ifscCode: account.ifscCode || "",
    branchName: account.branchName || "",
    upiId: account.upiId || "",
    status,
  };
}
