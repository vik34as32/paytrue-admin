import { superAdminModuleClient } from "@/lib/api/client";
import {
  normalizeUserDetail,
  userDetailToApiRecord,
} from "@/lib/normalizeUser";
import { mapApiUserToFormValues } from "@/lib/buildUserFormData";
import { UserDetailRecord, AdminDetailRecord } from "@/types/superAdmin";
import { NetworkUserEditValues } from "@/validations/networkUserSchemas";
import { AdminEditValues } from "@/validations/adminSchemas";
import { ApiResponse } from "@/types";
import { normalizeAdminDetail } from "@/lib/normalizeAdmin";

/** GET / PUT / DELETE `api/v1/super-admin/users/:userId` */
function superAdminUserPath(userId: string) {
  return `/users/${userId}`;
}

const STATUS_ENUM = new Set([
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "PENDING",
]);

const BUSINESS_TYPE_ENUM = new Set([
  "INDIVIDUAL",
  "PARTNERSHIP",
  "PRIVATE_LIMITED",
  "PROPRIETORSHIP",
  "OTHER",
]);

export const SUPER_ADMIN_BUSINESS_TYPE_OPTIONS = [
  { value: "", label: "Select business type" },
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "PRIVATE_LIMITED", label: "Private Limited" },
  { value: "PROPRIETORSHIP", label: "Proprietorship" },
  { value: "OTHER", label: "Other" },
];

function emptyToUndefined(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseOptionalNumber(value?: string | null): number | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeBusinessType(value?: string | null): string | undefined {
  const raw = emptyToUndefined(value);
  if (!raw) return undefined;
  const upper = raw.toUpperCase().replace(/[\s-]+/g, "_");
  if (BUSINESS_TYPE_ENUM.has(upper)) return upper;
  const aliases: Record<string, string> = {
    INDIVIDUAL: "INDIVIDUAL",
    PARTNERSHIP: "PARTNERSHIP",
    PRIVATE_LIMITED: "PRIVATE_LIMITED",
    PRIVATELIMITED: "PRIVATE_LIMITED",
    PVT_LTD: "PRIVATE_LIMITED",
    PROPRIETORSHIP: "PROPRIETORSHIP",
    PROPRIETOR: "PROPRIETORSHIP",
    OTHER: "OTHER",
  };
  return aliases[upper];
}

function normalizeStatus(value?: string | null): string | undefined {
  const upper = emptyToUndefined(value)?.toUpperCase();
  if (!upper || !STATUS_ENUM.has(upper)) return undefined;
  return upper;
}

function compactObject(
  value: Record<string, unknown>
): Record<string, unknown> | undefined {
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined || entry === null || entry === "") continue;
    if (typeof entry === "object" && !Array.isArray(entry)) {
      const nested = compactObject(entry as Record<string, unknown>);
      if (nested && Object.keys(nested).length > 0) {
        result[key] = nested;
      }
      continue;
    }
    result[key] = entry;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Body for PUT `/super-admin/users/:userId`
 * Matches Fastify `superAdminEditUserSchema` — JSON object only, no userType.
 */
function buildSuperAdminEditUserBody(
  values: NetworkUserEditValues | AdminEditValues,
  options?: { includeOutlet?: boolean }
): Record<string, unknown> {
  const includeOutlet = options?.includeOutlet ?? true;
  const password =
    "password" in values
      ? emptyToUndefined((values as NetworkUserEditValues).password)
      : undefined;

  const body: Record<string, unknown> = {
    firstName: emptyToUndefined(values.firstName),
    lastName: emptyToUndefined(values.lastName),
    name: emptyToUndefined(
      [values.firstName, values.lastName].filter(Boolean).join(" ")
    ),
    email: emptyToUndefined(values.email),
    mobile: emptyToUndefined(values.mobile),
    alternateMobileNumber: emptyToUndefined(values.alternateMobileNumber),
    status: normalizeStatus(values.status),
    password,
  };

  if (includeOutlet && "outletName" in values) {
    const networkValues = values as NetworkUserEditValues;
    body.outlet = {
      outletName: emptyToUndefined(networkValues.outletName),
      businessType: normalizeBusinessType(networkValues.businessType),
      gstNumber: emptyToUndefined(networkValues.gstNumber),
      address: emptyToUndefined(networkValues.address),
      state: emptyToUndefined(networkValues.state),
      district: emptyToUndefined(networkValues.district),
      city: emptyToUndefined(networkValues.city),
      village: emptyToUndefined(networkValues.village),
      pincode: emptyToUndefined(networkValues.pincode),
      latitude: parseOptionalNumber(networkValues.latitude),
      longitude: parseOptionalNumber(networkValues.longitude),
    };
    body.bankAccount = {
      accountHolderName: emptyToUndefined(networkValues.accountHolderName),
      bankName: emptyToUndefined(networkValues.bankName),
      accountNumber: emptyToUndefined(networkValues.accountNumber),
      ifscCode: emptyToUndefined(networkValues.ifscCode),
    };
    body.kyc = {
      aadhaarNumber: emptyToUndefined(networkValues.aadhaarNumber),
      panNumber: emptyToUndefined(networkValues.panNumber),
    };
    body.aadhaarNumber = emptyToUndefined(networkValues.aadhaarNumber);
    body.panNumber = emptyToUndefined(networkValues.panNumber);
  }

  // profileImage must be a URI string per schema — skip File uploads
  return compactObject(body) ?? {};
}

export function mapUserDetailToEditValues(
  user: UserDetailRecord
): NetworkUserEditValues {
  const mapped = mapApiUserToFormValues(userDetailToApiRecord(user));
  const outlet = user.outlet || {};
  const bank = user.bankAccount || {};

  return {
    firstName: mapped.firstName,
    lastName: mapped.lastName,
    email: mapped.email,
    mobile: mapped.mobile,
    password: "",
    alternateMobileNumber: mapped.alternateMobileNumber,
    outletName: mapped.outletName || user.businessName || outlet.outletName || "",
    businessType: (normalizeBusinessType(
      mapped.businessType || outlet.businessType
    ) || "") as NetworkUserEditValues["businessType"],
    gstNumber: mapped.gstNumber || outlet.gstNumber || "",
    state: mapped.state || user.state || outlet.state || "",
    district: mapped.district || outlet.district || "",
    city: mapped.city || user.city || outlet.city || "",
    village: mapped.village || outlet.village || "",
    pincode: mapped.pincode || outlet.pincode || "",
    address: mapped.address || outlet.address || "",
    latitude:
      mapped.latitude ||
      (outlet.latitude != null ? String(outlet.latitude) : ""),
    longitude:
      mapped.longitude ||
      (outlet.longitude != null ? String(outlet.longitude) : ""),
    aadhaarNumber: mapped.aadhaarNumber,
    panNumber: mapped.panNumber,
    accountHolderName: mapped.accountHolderName || bank.accountHolderName || "",
    bankName: mapped.bankName || bank.bankName || "",
    accountNumber: mapped.accountNumber || bank.accountNumber || "",
    ifscCode: mapped.ifscCode || bank.ifscCode || "",
    status: (normalizeStatus(user.status) ||
      "") as NetworkUserEditValues["status"],
    profileImage: null,
  };
}

export async function getUserById(id: string): Promise<UserDetailRecord> {
  const { data } = await superAdminModuleClient.get<
    ApiResponse<UserDetailRecord>
  >(superAdminUserPath(id));
  return normalizeUserDetail(data.data);
}

export async function updateUserById(
  id: string,
  values: NetworkUserEditValues,
  _userType?: string
): Promise<UserDetailRecord> {
  const body = buildSuperAdminEditUserBody(values, { includeOutlet: true });

  const { data } = await superAdminModuleClient.put<
    ApiResponse<UserDetailRecord>
  >(superAdminUserPath(id), body, {
    headers: { "Content-Type": "application/json" },
  });

  return normalizeUserDetail(data.data);
}

export async function deleteUserById(id: string): Promise<void> {
  await superAdminModuleClient.delete(superAdminUserPath(id));
}

export async function getAdminById(id: string): Promise<AdminDetailRecord> {
  const { data } = await superAdminModuleClient.get<
    ApiResponse<AdminDetailRecord>
  >(superAdminUserPath(id));
  return normalizeAdminDetail(data.data);
}

export async function updateAdminById(
  id: string,
  values: AdminEditValues
): Promise<AdminDetailRecord> {
  const body = buildSuperAdminEditUserBody(values, { includeOutlet: false });

  const { data } = await superAdminModuleClient.put<
    ApiResponse<AdminDetailRecord>
  >(superAdminUserPath(id), body, {
    headers: { "Content-Type": "application/json" },
  });

  return normalizeAdminDetail(data.data);
}
