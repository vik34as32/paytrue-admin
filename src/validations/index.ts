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

export const createAdminSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const masterDistributorSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  mobile: z.string().regex(mobileRegex, "Enter a valid 10-digit mobile number"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  outletName: z.string().min(2, "Outlet name is required"),
  outletAddress: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(6, "Valid pincode required"),
  aadhaarNumber: z.string().min(12, "Valid Aadhaar number required"),
  panNumber: z.string().min(10, "Valid PAN number required"),
  accountHolderName: z.string().min(2, "Account holder name is required"),
  accountNumber: z.string().min(8, "Valid account number required"),
  ifscCode: z.string().min(11, "Valid IFSC code required"),
  bankName: z.string().min(2, "Bank name is required"),
});

export type MasterDistributorFormData = z.infer<typeof masterDistributorSchema>;

export const superAdminLoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const adminEmailLoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const addBalanceSchema = z.object({
  amount: z
    .number({ error: "Amount is required" })
    .min(1, "Amount must be greater than 0"),
  remarks: z.string().min(3, "Remarks must be at least 3 characters"),
});

export const superAdminTransferSchema = z.object({
  adminId: z.string().min(1, "Please select an admin"),
  amount: z
    .number({ error: "Amount is required" })
    .min(1, "Amount must be greater than 0"),
  remarks: z.string().min(3, "Remarks are required"),
});

export const adminTransferSchema = z.object({
  masterDistributorId: z.string().min(1, "Please select a master distributor"),
  amount: z
    .number({ error: "Amount is required" })
    .min(1, "Amount must be greater than 0"),
  remarks: z.string().min(3, "Remarks are required"),
});

export const superAdminProfileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .regex(mobileRegex, "Enter a valid 10-digit mobile number"),
});
export type CreateAdminFormData = z.infer<typeof createAdminSchema>;
export type SuperAdminLoginFormData = z.infer<typeof superAdminLoginSchema>;
export type AdminEmailLoginFormData = z.infer<typeof adminEmailLoginSchema>;
export type AddBalanceFormData = z.infer<typeof addBalanceSchema>;
export type SuperAdminTransferFormData = z.infer<typeof superAdminTransferSchema>;
export type AdminTransferFormData = z.infer<typeof adminTransferSchema>;
export type SuperAdminProfileFormData = z.infer<typeof superAdminProfileSchema>;
