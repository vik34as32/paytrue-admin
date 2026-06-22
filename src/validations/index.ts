import { z } from "zod";

const mobileRegex = /^[6-9]\d{9}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const loginSchema = z.object({
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .regex(mobileRegex, "Enter a valid 10-digit mobile number"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .regex(mobileRegex, "Enter a valid 10-digit mobile number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      passwordRegex,
      "Password must contain uppercase, lowercase and number"
    ),
  confirmPassword: z.string().min(1, "Confirm password is required"),
  role: z.enum([
    "super_admin",
    "admin",
    "master_distributor",
    "distributor",
    "retailer",
  ]),
  parentId: z.string().optional(),
  balance: z.number().min(0, "Balance cannot be negative").optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .regex(mobileRegex, "Enter a valid 10-digit mobile number"),
  role: z.enum([
    "super_admin",
    "admin",
    "master_distributor",
    "distributor",
    "retailer",
  ]),
  parentId: z.string().optional(),
  status: z.enum(["active", "suspended", "inactive"]),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .regex(mobileRegex, "Enter a valid 10-digit mobile number"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        passwordRegex,
        "Password must contain uppercase, lowercase and number"
      ),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const balanceTransferSchema = z.object({
  toUserId: z.string().min(1, "Select a recipient"),
  amount: z
    .number({ error: "Amount is required" })
    .min(1, "Amount must be greater than 0")
    .max(10000000, "Amount exceeds maximum limit"),
  remarks: z.string().min(3, "Remarks must be at least 3 characters"),
});

export const requestApprovalSchema = z.object({
  verified: z.literal(true, { message: "You must verify this request" }),
  remarks: z.string().min(3, "Remarks are required"),
});

export const requestRejectionSchema = z.object({
  reason: z.string().min(5, "Rejection reason must be at least 5 characters"),
});

export const requestAmountSchema = z.object({
  amount: z
    .number({ error: "Amount is required" })
    .min(100, "Minimum request amount is ₹100")
    .max(500000, "Maximum request amount is ₹5,00,000"),
  remarks: z.string().min(3, "Remarks must be at least 3 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type BalanceTransferFormData = z.infer<typeof balanceTransferSchema>;
export type RequestApprovalFormData = z.infer<typeof requestApprovalSchema>;
export type RequestRejectionFormData = z.infer<typeof requestRejectionSchema>;
export type RequestAmountFormData = z.infer<typeof requestAmountSchema>;
