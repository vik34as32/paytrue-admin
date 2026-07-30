import { z } from "zod";

export const applyWalletLienSchema = z.object({
  userId: z.string().min(1, "Select a user"),
  amount: z.number().positive("Amount must be greater than 0"),
  reason: z
    .string()
    .trim()
    .min(3, "Reason must be at least 3 characters")
    .max(500, "Reason is too long"),
  remarks: z.string().trim().max(500).optional().or(z.literal("")),
});

export type ApplyWalletLienFormValues = z.infer<typeof applyWalletLienSchema>;

export const releaseWalletLienSchema = z
  .object({
    amount: z.number().positive("Amount must be greater than 0"),
    remarks: z.string().trim().max(500).optional().or(z.literal("")),
    maxAmount: z.number().positive(),
  })
  .superRefine((data, ctx) => {
    if (data.amount > data.maxAmount + 1e-9) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Amount cannot exceed remaining lien",
      });
    }
  });

export type ReleaseWalletLienFormValues = z.infer<
  typeof releaseWalletLienSchema
>;
