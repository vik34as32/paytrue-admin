import { USER_FILE_FIELDS, UserFileFieldKey } from "@/constants/uploadConfig";
import { UserFormValues } from "@/validations/userStepSchemas";

export interface ApiUserRecord {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  alternateMobileNumber?: string;
  profileImage?: string;
  state?: string;
  city?: string;
  outlet?: {
    outletName?: string;
    businessType?: string;
    gstNumber?: string;
    address?: string;
    state?: string;
    district?: string;
    city?: string;
    village?: string;
    pincode?: string;
    latitude?: string | number;
    longitude?: string | number;
  };
  kyc?: {
    aadhaarNumber?: string;
    panNumber?: string;
    aadhaarFrontImage?: string;
    aadhaarFront?: string;
    aadhaarBackImage?: string;
    aadhaarBack?: string;
    panCardImage?: string;
    panCard?: string;
    ownerPhoto?: string;
    videoVerification?: string;
  };
  bankAccount?: {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    passbookImage?: string;
    cancelledChequeImage?: string;
  };
}

export interface BuildUserFormDataOptions {
  userType: string;
  includePassword?: boolean;
}

function appendIfPresent(formData: FormData, key: string, value: unknown) {
  if (value !== undefined && value !== null && value !== "") {
    formData.append(key, String(value));
  }
}

function appendFileIfPresent(formData: FormData, key: string, file: File | undefined) {
  if (file instanceof File) {
    formData.append(key, file);
  }
}

export function extractUserFiles(
  values: UserFormValues
): Partial<Record<UserFileFieldKey, File>> {
  const files: Partial<Record<UserFileFieldKey, File>> = {};
  (Object.keys(USER_FILE_FIELDS) as UserFileFieldKey[]).forEach((key) => {
    const value = values[key];
    if (value instanceof File) {
      files[key] = value;
    }
  });
  return files;
}

/** Build multipart/form-data for POST/PUT /users */
export function buildUserFormData(
  values: UserFormValues,
  files: Partial<Record<UserFileFieldKey, File>> = {},
  options: BuildUserFormDataOptions
): FormData {
  const { userType, includePassword = true } = options;
  const formData = new FormData();

  appendIfPresent(formData, "firstName", values.firstName);
  appendIfPresent(formData, "lastName", values.lastName);
  appendIfPresent(formData, "email", values.email);
  appendIfPresent(formData, "mobile", values.mobile);
  appendIfPresent(formData, "alternateMobileNumber", values.alternateMobileNumber);
  appendIfPresent(formData, "userType", userType);

  if (includePassword && values.password) {
    appendIfPresent(formData, "password", values.password);
  }

  formData.append(
    "outlet",
    JSON.stringify({
      outletName: values.outletName,
      businessType: values.businessType,
      gstNumber: values.gstNumber,
      address: values.address,
      state: values.state,
      district: values.district,
      city: values.city,
      village: values.village,
      pincode: values.pincode,
      latitude: values.latitude,
      longitude: values.longitude,
    })
  );

  formData.append(
    "kyc",
    JSON.stringify({
      aadhaarNumber: values.aadhaarNumber,
      panNumber: values.panNumber,
    })
  );

  formData.append(
    "bankAccount",
    JSON.stringify({
      accountHolderName: values.accountHolderName,
      bankName: values.bankName,
      accountNumber: values.accountNumber,
      ifscCode: values.ifscCode,
    })
  );

  (Object.entries(USER_FILE_FIELDS) as [UserFileFieldKey, string][]).forEach(
    ([formKey, apiKey]) => {
      appendFileIfPresent(formData, apiKey, files[formKey]);
    }
  );

  return formData;
}

export function mapApiUserToFormValues(
  user: ApiUserRecord = {}
): Omit<
  UserFormValues,
  | "profileImage"
  | "aadhaarFront"
  | "aadhaarBack"
  | "panCard"
  | "ownerPhoto"
  | "videoVerification"
  | "passbookImage"
  | "cancelledChequeImage"
> {
  const outlet = user.outlet || {};
  const kyc = user.kyc || {};
  const bank = user.bankAccount || {};

  return {
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    mobile: user.mobile || "",
    password: "",
    alternateMobileNumber: user.alternateMobileNumber || "",
    outletName: outlet.outletName || "",
    businessType: outlet.businessType || "",
    gstNumber: outlet.gstNumber || "",
    address: outlet.address || "",
    state: outlet.state || user.state || "",
    district: outlet.district || "",
    city: outlet.city || user.city || "",
    village: outlet.village || "",
    pincode: outlet.pincode || "",
    latitude: outlet.latitude != null ? String(outlet.latitude) : "",
    longitude: outlet.longitude != null ? String(outlet.longitude) : "",
    aadhaarNumber: kyc.aadhaarNumber || "",
    panNumber: kyc.panNumber || "",
    accountHolderName: bank.accountHolderName || "",
    bankName: bank.bankName || "",
    accountNumber: bank.accountNumber || "",
    ifscCode: bank.ifscCode || "",
  };
}

export function mapApiUserToExistingUrls(
  user: ApiUserRecord = {}
): Partial<Record<UserFileFieldKey, string | null>> {
  const kyc = user.kyc || {};
  const bank = user.bankAccount || {};

  return {
    profileImage: user.profileImage || null,
    aadhaarFront: kyc.aadhaarFrontImage || kyc.aadhaarFront || null,
    aadhaarBack: kyc.aadhaarBackImage || kyc.aadhaarBack || null,
    panCard: kyc.panCardImage || kyc.panCard || null,
    ownerPhoto: kyc.ownerPhoto || null,
    videoVerification: kyc.videoVerification || null,
    passbookImage: bank.passbookImage || null,
    cancelledChequeImage: bank.cancelledChequeImage || null,
  };
}
