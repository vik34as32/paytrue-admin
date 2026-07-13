import { z } from "zod";

const mobileRegex = /^[6-9]\d{9}$/;

const businessTypeEnum = z.enum([
  "INDIVIDUAL",
  "PARTNERSHIP",
  "PRIVATE_LIMITED",
  "PROPRIETORSHIP",
  "OTHER",
]);

export const networkUserEditSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  mobile: z.string().regex(mobileRegex, "Enter a valid 10-digit mobile number"),
  password: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.length === 0 || value.length >= 8,
      "Password must be at least 8 characters"
    ),
  alternateMobileNumber: z.string().optional(),
  outletName: z.string().min(2, "Outlet name is required"),
  businessType: z
    .union([businessTypeEnum, z.literal("")])
    .optional(),
  gstNumber: z.string().optional(),
  state: z.string().min(2, "State is required"),
  district: z.string().optional(),
  city: z.string().min(2, "City is required"),
  village: z.string().optional(),
  pincode: z.string().optional(),
  address: z.string().min(5, "Address is required"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  panNumber: z.string().optional(),
  accountHolderName: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  status: z
    .enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING", ""])
    .optional(),
  profileImage: z.custom<File | null>().nullable().optional(),
});

export type NetworkUserEditValues = z.infer<typeof networkUserEditSchema>;

export const networkUserEditEmptyDefaults: NetworkUserEditValues = {
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
  password: "",
  alternateMobileNumber: "",
  outletName: "",
  businessType: "",
  gstNumber: "",
  state: "",
  district: "",
  city: "",
  village: "",
  pincode: "",
  address: "",
  latitude: "",
  longitude: "",
  aadhaarNumber: "",
  panNumber: "",
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  status: "",
  profileImage: null,
};
