import { z } from "zod";

const mobileRegex = /^[6-9]\d{9}$/;

export const adminEditSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  mobile: z.string().regex(mobileRegex, "Enter a valid 10-digit mobile number"),
  alternateMobileNumber: z.string().optional(),
  status: z.string().optional(),
  profileImage: z.custom<File | null>().nullable().optional(),
});

export type AdminEditValues = z.infer<typeof adminEditSchema>;

export const adminEditEmptyDefaults: AdminEditValues = {
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
  alternateMobileNumber: "",
  status: "",
  profileImage: null,
};

export function mapAdminDetailToEditValues(admin: {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  alternateMobileNumber?: string;
  status?: string;
}): AdminEditValues {
  return {
    firstName: admin.firstName || "",
    lastName: admin.lastName || "",
    email: admin.email || "",
    mobile: admin.mobile || "",
    alternateMobileNumber: admin.alternateMobileNumber || "",
    status: admin.status || "",
    profileImage: null,
  };
}
