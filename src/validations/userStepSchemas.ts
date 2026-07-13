import { z } from "zod";

const mobileRegex = /^[6-9]\d{9}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const personalStepSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  mobile: z.string().regex(mobileRegex, "Enter a valid 10-digit mobile number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      passwordRegex,
      "Password must contain uppercase, lowercase and number"
    ),
  alternateMobileNumber: z.string().optional(),
  profileImage: z
    .custom<File | null>((value) => value instanceof File, {
      message: "Profile image is required",
    }),
});

export const outletStepSchema = z.object({
  outletName: z.string().min(2, "Outlet name is required"),
  businessType: z.string().optional(),
  gstNumber: z.string().optional(),
  address: z.string().min(5, "Address is required"),
  state: z.string().min(2, "State is required"),
  district: z.string().optional(),
  city: z.string().min(2, "City is required"),
  village: z.string().optional(),
  pincode: z.string().min(6, "Valid pincode required"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

const aadhaarRegex = /^\d{12}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export const kycStepSchema = z.object({
  aadhaarNumber: z
    .string()
    .regex(aadhaarRegex, "Enter a valid 12-digit Aadhaar number"),
  panNumber: z
    .string()
    .length(10, "PAN must be 10 characters")
    .regex(panRegex, "Enter a valid PAN (e.g. ABCDE1234F)"),
  aadhaarFront: z.custom<File | null>((value) => value instanceof File, {
    message: "Aadhaar front image is required",
  }),
  aadhaarBack: z.custom<File | null>((value) => value instanceof File, {
    message: "Aadhaar back image is required",
  }),
  panCard: z.custom<File | null>((value) => value instanceof File, {
    message: "PAN card image is required",
  }),
  ownerPhoto: z.custom<File | null>((value) => value instanceof File, {
    message: "Owner photo is required",
  }),
  videoVerification: z.custom<File | null>().nullable().optional(),
});

export const bankStepSchema = z.object({
  accountHolderName: z.string().min(2, "Account holder name is required"),
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z.string().min(8, "Valid account number required"),
  ifscCode: z.string().min(11, "Valid IFSC code required"),
  passbookImage: z.custom<File | null>().nullable().optional(),
  cancelledChequeImage: z.custom<File | null>().nullable().optional(),
});

export type UserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  alternateMobileNumber?: string;
  profileImage: File | null;
  outletName: string;
  businessType?: string;
  gstNumber?: string;
  address: string;
  state: string;
  district?: string;
  city: string;
  village?: string;
  pincode: string;
  latitude?: string;
  longitude?: string;
  aadhaarNumber: string;
  aadhaarFront: File | null;
  aadhaarBack: File | null;
  panNumber: string;
  panCard: File | null;
  ownerPhoto: File | null;
  videoVerification: File | null;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  passbookImage: File | null;
  cancelledChequeImage: File | null;
};

export const userFormEmptyDefaults: UserFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
  password: "",
  alternateMobileNumber: "",
  profileImage: null,
  outletName: "",
  businessType: "",
  gstNumber: "",
  address: "",
  state: "",
  district: "",
  city: "",
  village: "",
  pincode: "",
  latitude: "",
  longitude: "",
  aadhaarNumber: "",
  aadhaarFront: null,
  aadhaarBack: null,
  panNumber: "",
  panCard: null,
  ownerPhoto: null,
  videoVerification: null,
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  passbookImage: null,
  cancelledChequeImage: null,
};

export const USER_FORM_STEPS = [
  { id: 1, title: "Personal Details", schema: personalStepSchema },
  { id: 2, title: "Outlet Information", schema: outletStepSchema },
  { id: 3, title: "KYC", schema: kycStepSchema },
  { id: 4, title: "Bank Details", schema: bankStepSchema },
  { id: 5, title: "Preview", schema: null },
] as const;

export type AdminCreateUserType =
  | "MASTER_DISTRIBUTOR"
  | "DISTRIBUTOR"
  | "RETAILER";
