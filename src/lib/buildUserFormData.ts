import { USER_FILE_FIELDS, UserFileFieldKey } from "@/constants/uploadConfig";
import { toApiGender } from "@/constants/gender";
import { UserFormValues } from "@/validations/userStepSchemas";

const OUTLET_BUSINESS_TYPES = new Set([
  "INDIVIDUAL",
  "PARTNERSHIP",
  "PRIVATE_LIMITED",
  "PROPRIETORSHIP",
  "OTHER",
]);

export interface ApiUserRecord {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  alternateMobileNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  masterDistributorId?: string;
  parentId?: string;
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
    gender?: string;
    dateOfBirth?: string;
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

/** Split "Full Name" into first + last for APIs that still expect both. */
export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
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

  const fullName =
    (values.fullName || "").trim() ||
    [values.firstName, values.lastName].filter(Boolean).join(" ").trim();
  const derived = splitFullName(fullName);
  const firstName = (values.firstName || "").trim() || derived.firstName;
  const lastName = (values.lastName || "").trim() || derived.lastName;

  appendIfPresent(formData, "firstName", firstName);
  appendIfPresent(formData, "lastName", lastName);
  appendIfPresent(formData, "fullName", fullName);
  appendIfPresent(formData, "name", fullName);
  appendIfPresent(formData, "email", values.email);
  appendIfPresent(formData, "mobile", values.mobile);
  appendIfPresent(formData, "alternateMobileNumber", values.alternateMobileNumber);
  appendIfPresent(formData, "gender", toApiGender(values.gender));
  appendIfPresent(formData, "dateOfBirth", values.dateOfBirth);
  appendIfPresent(formData, "userType", userType);
  // Retailer hierarchy: form parentId = API distributorId
  appendIfPresent(formData, "parentId", values.parentId);
  appendIfPresent(formData, "distributorId", values.parentId);
  appendIfPresent(formData, "masterDistributorId", values.masterDistributorId);

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

function parseOptionalNumber(value?: string): number | undefined {
  if (value === undefined || value === null || String(value).trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function compactObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === "") continue;
    next[key] = value;
  }
  return next as Partial<T>;
}

export interface AdminHierarchyCreatePayload {
  email: string;
  mobile: string;
  password: string;
  firstName: string;
  lastName?: string;
  name?: string;
  userType: "MASTER_DISTRIBUTOR" | "DISTRIBUTOR" | "RETAILER";
  masterDistributorId?: string;
  distributorId?: string;
  alternateMobileNumber?: string;
  gender?: "M" | "F" | "T";
  dateOfBirth?: string;
  aadhaar?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  address?: string;
  city?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  outlet?: {
    outletName: string;
    businessType?: string;
    gstNumber?: string;
    address?: string;
    state?: string;
    district?: string;
    city?: string;
    village?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
  };
  kyc?: {
    aadhaarNumber?: string;
    panNumber?: string;
  };
  bankAccount?: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };
}

/**
 * JSON body for POST /api/v1/admin/users.
 * Fastify rejects multipart here with `{ field: "body", message: "must be object" }`
 * before Zod runs. Nested outlet / kyc / bankAccount must be objects, not strings.
 */
export function buildAdminHierarchyCreatePayload(
  values: UserFormValues,
  userType: "RETAILER" | "DISTRIBUTOR" | "MASTER_DISTRIBUTOR"
): AdminHierarchyCreatePayload {
  const fullName =
    (values.fullName || "").trim() ||
    [values.firstName, values.lastName].filter(Boolean).join(" ").trim();
  const derived = splitFullName(fullName);
  const firstName = (values.firstName || "").trim() || derived.firstName;
  const lastName = (values.lastName || "").trim() || derived.lastName;
  const pan = (values.panNumber || "").trim().toUpperCase();
  const aadhaar = (values.aadhaarNumber || "").replace(/\D/g, "");
  const gender = toApiGender(values.gender);
  const latitude = parseOptionalNumber(values.latitude);
  const longitude = parseOptionalNumber(values.longitude);
  const businessType = (values.businessType || "").trim().toUpperCase();
  const dateOfBirth = (values.dateOfBirth || "").trim();
  const pincode = (values.pincode || "").trim();

  const payload: AdminHierarchyCreatePayload = {
    email: values.email.trim(),
    mobile: values.mobile.trim(),
    password: values.password,
    firstName,
    userType,
  };

  if (lastName) payload.lastName = lastName;
  if (fullName) payload.name = fullName;
  if (gender) payload.gender = gender;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    payload.dateOfBirth = dateOfBirth;
  }
  if (/^\d{12}$/.test(aadhaar)) {
    payload.aadhaar = aadhaar;
    payload.aadhaarNumber = aadhaar;
  }
  if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    payload.panNumber = pan;
  }
  if (values.address?.trim()) payload.address = values.address.trim();
  if (values.city?.trim()) payload.city = values.city.trim();
  if (/^\d{6}$/.test(pincode)) payload.pincode = pincode;
  if (latitude !== undefined) payload.latitude = latitude;
  if (longitude !== undefined) payload.longitude = longitude;
  if (values.alternateMobileNumber?.trim()) {
    payload.alternateMobileNumber = values.alternateMobileNumber.trim();
  }

  if (userType === "DISTRIBUTOR" || userType === "RETAILER") {
    const masterDistributorId = (values.masterDistributorId || "").trim();
    if (masterDistributorId) payload.masterDistributorId = masterDistributorId;
  }
  if (userType === "RETAILER") {
    const distributorId = (values.parentId || "").trim();
    if (distributorId) payload.distributorId = distributorId;
  }

  const outletName = (values.outletName || "").trim();
  if (outletName) {
    payload.outlet = {
      outletName,
      ...compactObject({
        businessType: OUTLET_BUSINESS_TYPES.has(businessType)
          ? businessType
          : undefined,
        gstNumber: values.gstNumber?.trim(),
        address: values.address?.trim(),
        state: values.state?.trim(),
        district: values.district?.trim(),
        city: values.city?.trim(),
        village: values.village?.trim(),
        pincode: /^\d{6}$/.test(pincode) ? pincode : undefined,
        latitude,
        longitude,
      }),
    };
  }

  const kyc = compactObject({
    aadhaarNumber: /^\d{12}$/.test(aadhaar) ? aadhaar : undefined,
    panNumber: /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan) ? pan : undefined,
  });
  if (Object.keys(kyc).length) {
    payload.kyc = kyc;
  }

  const accountHolderName = (values.accountHolderName || "").trim();
  const bankName = (values.bankName || "").trim();
  const accountNumber = (values.accountNumber || "").trim();
  const ifscCode = (values.ifscCode || "").trim().toUpperCase();
  if (accountHolderName && bankName && accountNumber && ifscCode) {
    payload.bankAccount = {
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
    };
  }

  return payload;
}

/**
 * Multipart payload for POST /api/v1/admin/users
 * (Admin + Super Admin, retailer / distributor create).
 * UI stays the same; this maps collected fields to adminCreateUserSchema.
 */
export function buildAdminHierarchyCreateFormData(
  values: UserFormValues,
  userType: "RETAILER" | "DISTRIBUTOR" | "MASTER_DISTRIBUTOR"
): FormData {
  const formData = new FormData();
  const files = extractUserFiles(values);

  const fullName =
    (values.fullName || "").trim() ||
    [values.firstName, values.lastName].filter(Boolean).join(" ").trim();
  const derived = splitFullName(fullName);
  const firstName = (values.firstName || "").trim() || derived.firstName;
  const lastName = (values.lastName || "").trim() || derived.lastName;
  const pan = (values.panNumber || "").trim().toUpperCase();
  const aadhaar = (values.aadhaarNumber || "").replace(/\D/g, "");
  const gender = toApiGender(values.gender);
  const latitude = parseOptionalNumber(values.latitude);
  const longitude = parseOptionalNumber(values.longitude);
  const businessType = (values.businessType || "").trim().toUpperCase();

  appendIfPresent(formData, "email", values.email.trim());
  appendIfPresent(formData, "mobile", values.mobile.trim());
  appendIfPresent(formData, "password", values.password);
  appendIfPresent(formData, "firstName", firstName);
  appendIfPresent(formData, "lastName", lastName);
  appendIfPresent(formData, "name", fullName);
  appendIfPresent(formData, "userType", userType);
  appendIfPresent(formData, "alternateMobileNumber", values.alternateMobileNumber);
  appendIfPresent(formData, "gender", gender);
  appendIfPresent(formData, "dateOfBirth", values.dateOfBirth);
  appendIfPresent(formData, "aadhaar", aadhaar);
  appendIfPresent(formData, "aadhaarNumber", aadhaar);
  appendIfPresent(formData, "panNumber", pan);
  appendIfPresent(formData, "address", values.address);
  appendIfPresent(formData, "city", values.city);
  appendIfPresent(formData, "pincode", values.pincode);
  if (latitude !== undefined) formData.append("latitude", String(latitude));
  if (longitude !== undefined) formData.append("longitude", String(longitude));

  if (userType === "DISTRIBUTOR" || userType === "RETAILER") {
    appendIfPresent(formData, "masterDistributorId", values.masterDistributorId);
  }
  if (userType === "RETAILER") {
    appendIfPresent(formData, "distributorId", values.parentId);
  }

  const outlet = compactObject({
    outletName: values.outletName,
    businessType: OUTLET_BUSINESS_TYPES.has(businessType)
      ? businessType
      : undefined,
    gstNumber: values.gstNumber,
    address: values.address,
    state: values.state,
    district: values.district,
    city: values.city,
    village: values.village,
    pincode: values.pincode,
    latitude,
    longitude,
  });
  if (Object.keys(outlet).length) {
    formData.append("outlet", JSON.stringify(outlet));
  }

  const kyc = compactObject({
    aadhaarNumber: aadhaar,
    panNumber: pan,
  });
  if (Object.keys(kyc).length) {
    formData.append("kyc", JSON.stringify(kyc));
  }

  const bankAccount = compactObject({
    accountHolderName: values.accountHolderName,
    bankName: values.bankName,
    accountNumber: values.accountNumber,
    ifscCode: (values.ifscCode || "").trim().toUpperCase(),
  });
  if (Object.keys(bankAccount).length) {
    formData.append("bankAccount", JSON.stringify(bankAccount));
  }

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
    fullName:
      user.fullName ||
      user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      "",
    email: user.email || "",
    mobile: user.mobile || user.phone || "",
    password: "",
    alternateMobileNumber:
      user.alternateMobileNumber || profile.alternateMobileNumber || "",
    gender: user.gender || profile.gender || "",
    dateOfBirth: user.dateOfBirth || profile.dateOfBirth || "",
    masterDistributorId: user.masterDistributorId || "",
    parentId: user.parentId || "",
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
