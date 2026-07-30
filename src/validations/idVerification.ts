import { z } from "zod";

export const verifyUserSchema = z.object({
  remark: z
    .string()
    .trim()
    .max(500, "Remark must be at most 500 characters")
    .optional()
    .or(z.literal("")),
});

export const rejectUserSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must be at most 500 characters"),
});

export type VerifyUserFormValues = z.infer<typeof verifyUserSchema>;
export type RejectUserFormValues = z.infer<typeof rejectUserSchema>;
