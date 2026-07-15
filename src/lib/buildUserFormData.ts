import { USER_FILE_FIELDS, UserFileFieldKey } from "@/constants/uploadConfig";
import { UserFormValues } from "@/validations/userStepSchemas";

export interface ApiUserRecord {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  alternateMobileNumber?: string;
  profileImage?: string;
  state?: string;
  city?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  panCardUrl?: string;
  ownerPhotoUrl?: string;
  profile?: {
    alternateMobileNumber?: string;
    profileImage?: string;
  };
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
    outletImage?: string;
    outletPhoto?: string;
  };
  kyc?: {
    aadhaarNumber?: string;
    panNumber?: string;
    aadhaarFrontImage?: string;
    aadhaarFront?: string;
    aadhaarFrontUrl?: string;
    aadhaarBackImage?: string;
    aadhaarBack?: string;
    aadhaarBackUrl?: string;
    panCardImage?: string;
    panCard?: string;
    panCardUrl?: string;
    ownerPhoto?: string;
    ownerPhotoUrl?: string;
    videoVerification?: string;
    videoVerificationUrl?: string;
  };
  bankAccount?: {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    passbookImage?: string;
    passbookUrl?: string;
    cancelledChequeImage?: string;
    cancelledChequeUrl?: string;
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
  const profile = user.profile || {};

  return {
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    mobile: user.mobile || user.phone || "",
    password: "",
    alternateMobileNumber:
      user.alternateMobileNumber || profile.alternateMobileNumber || "",
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
    aadhaarNumber: kyc.aadhaarNumber || user.aadhaarNumber || "",
    panNumber: kyc.panNumber || user.panNumber || "",
    accountHolderName: bank.accountHolderName || "",
    bankName: bank.bankName || "",
    accountNumber: bank.accountNumber || "",
    ifscCode: bank.ifscCode || "",
  };
}

function firstUrl(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function mapApiUserToExistingUrls(
  user: ApiUserRecord = {}
): Partial<Record<UserFileFieldKey, string | null>> {
  const kyc = user.kyc || {};
  const bank = user.bankAccount || {};
  const profile = user.profile || {};
  const outlet = user.outlet || {};

  return {
    profileImage: firstUrl(user.profileImage, profile.profileImage),
    aadhaarFront: firstUrl(
      kyc.aadhaarFrontUrl,
      kyc.aadhaarFrontImage,
      kyc.aadhaarFront,
      user.aadhaarFrontUrl
    ),
    aadhaarBack: firstUrl(
      kyc.aadhaarBackUrl,
      kyc.aadhaarBackImage,
      kyc.aadhaarBack,
      user.aadhaarBackUrl
    ),
    panCard: firstUrl(
      kyc.panCardUrl,
      kyc.panCardImage,
      kyc.panCard,
      user.panCardUrl
    ),
    ownerPhoto: firstUrl(
      kyc.ownerPhotoUrl,
      kyc.ownerPhoto,
      user.ownerPhotoUrl
    ),
    videoVerification: firstUrl(
      kyc.videoVerificationUrl,
      kyc.videoVerification
    ),
    passbookImage: firstUrl(bank.passbookImage, bank.passbookUrl),
    cancelledChequeImage: firstUrl(
      bank.cancelledChequeImage,
      bank.cancelledChequeUrl
    ),
  };
}

/** Extra media URLs that are not in USER_FILE_FIELDS (e.g. outlet). */
export function mapApiUserToExtraMediaUrls(
  user: ApiUserRecord = {}
): { outletImage: string | null } {
  const outlet = user.outlet || {};
  return {
    outletImage: firstUrl(
      outlet.outletImage,
      outlet.outletPhoto,
      (outlet as { shopImage?: string }).shopImage
    ),
  };
}
