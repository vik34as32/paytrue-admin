import { z } from "zod";

export const walletActionAmountSchema = z.object({
  amount: z
    .number({ error: "Amount is required" })
    .int("Amount must be a whole number (no decimals)")
    .min(1, "Amount must be at least ₹1"),
  description: z.string().min(3, "Description is required"),
});

export type WalletActionAmountFormValues = z.infer<
  typeof walletActionAmountSchema
>;

export const walletLienActionSchema = z.object({
  mode: z.enum(["hold", "release"]),
  amount: z
    .number({ error: "Amount is required" })
    .int("Amount must be a whole number (no decimals)")
    .min(1, "Amount must be at least ₹1"),
  reason: z
    .string()
    .trim()
    .min(3, "Reason is required")
    .max(500, "Reason is too long"),
});

export type WalletLienActionFormValues = z.infer<typeof walletLienActionSchema>;
