import { AxiosRequestConfig } from "axios";
import { superAdminModuleClient } from "@/lib/api/client";
import { buildUserFormData } from "@/lib/buildUserFormData";
import {
  normalizeUserDetail,
  userDetailToApiRecord,
} from "@/lib/normalizeUser";
import { mapApiUserToFormValues } from "@/lib/buildUserFormData";
import { UserDetailRecord, AdminDetailRecord } from "@/types/superAdmin";
import { NetworkUserEditValues } from "@/validations/networkUserSchemas";
import { AdminEditValues } from "@/validations/adminSchemas";
import { UserFormValues } from "@/validations/userStepSchemas";
import { ApiResponse } from "@/types";
import { UserFileFieldKey } from "@/constants/uploadConfig";
import { normalizeAdminDetail } from "@/lib/normalizeAdmin";

/** Super Admin user routes: GET/PUT/DELETE `/api/v1/super-admin/users/:userId` */
function superAdminUserPath(userId: string) {
  return `/users/${userId}`;
}

/** Let axios set multipart boundary (strip default application/json). */
const multipartConfig: AxiosRequestConfig = {
  headers: {
    "Content-Type": false as unknown as string,
  },
};

function mapEditValuesToFormValues(values: NetworkUserEditValues): UserFormValues {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    mobile: values.mobile,
    password: "",
    alternateMobileNumber: values.alternateMobileNumber || "",
    outletName: values.outletName,
    businessType: values.businessType || "",
    gstNumber: values.gstNumber || "",
    address: values.address,
    state: values.state,
    district: values.district || "",
    city: values.city,
    village: values.village || "",
    pincode: values.pincode || "",
    latitude: values.latitude || "",
    longitude: values.longitude || "",
    aadhaarNumber: values.aadhaarNumber || "",
    panNumber: values.panNumber || "",
    accountHolderName: values.accountHolderName || "",
    bankName: values.bankName || "",
    accountNumber: values.accountNumber || "",
    ifscCode: values.ifscCode || "",
    profileImage: values.profileImage ?? null,
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
    ownerPhoto: null,
    videoVerification: null,
    passbookImage: null,
    cancelledChequeImage: null,
  };
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
    alternateMobileNumber: mapped.alternateMobileNumber,
    outletName: mapped.outletName || user.businessName || outlet.outletName || "",
    businessType: mapped.businessType || outlet.businessType || "",
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
    status: user.status || "",
    profileImage: null,
  };
}

function extractEditFiles(
  values: NetworkUserEditValues
): Partial<Record<UserFileFieldKey, File>> {
  if (values.profileImage instanceof File) {
    return { profileImage: values.profileImage };
  }
  return {};
}

function emptyToUndefined(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** JSON body expected by PUT `/super-admin/users/:userId` */
function buildNetworkUserUpdateBody(
  values: NetworkUserEditValues,
  userType: string
) {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    mobile: values.mobile.trim(),
    alternateMobileNumber: emptyToUndefined(values.alternateMobileNumber),
    userType,
    status: emptyToUndefined(values.status),
    outlet: {
      outletName: values.outletName,
      businessType: emptyToUndefined(values.businessType),
      gstNumber: emptyToUndefined(values.gstNumber),
      address: values.address,
      state: values.state,
      district: emptyToUndefined(values.district),
      city: values.city,
      village: emptyToUndefined(values.village),
      pincode: emptyToUndefined(values.pincode),
      latitude: emptyToUndefined(values.latitude),
      longitude: emptyToUndefined(values.longitude),
    },
    kyc: {
      aadhaarNumber: emptyToUndefined(values.aadhaarNumber),
      panNumber: emptyToUndefined(values.panNumber),
    },
    bankAccount: {
      accountHolderName: emptyToUndefined(values.accountHolderName),
      bankName: emptyToUndefined(values.bankName),
      accountNumber: emptyToUndefined(values.accountNumber),
      ifscCode: emptyToUndefined(values.ifscCode),
    },
  };
}

function buildAdminUpdateBody(values: AdminEditValues) {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    mobile: values.mobile.trim(),
    alternateMobileNumber: emptyToUndefined(values.alternateMobileNumber),
    userType: "ADMIN",
    status: emptyToUndefined(values.status),
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
  userType: string
): Promise<UserDetailRecord> {
  const files = extractEditFiles(values);
  const hasFile = Object.keys(files).length > 0;

  if (hasFile) {
    const formValues = mapEditValuesToFormValues(values);
    const formData = buildUserFormData(formValues, files, {
      userType,
      includePassword: false,
    });
    if (values.status) {
      formData.append("status", values.status);
    }

    const { data } = await superAdminModuleClient.put<
      ApiResponse<UserDetailRecord>
    >(superAdminUserPath(id), formData, multipartConfig);
    return normalizeUserDetail(data.data);
  }

  const { data } = await superAdminModuleClient.put<
    ApiResponse<UserDetailRecord>
  >(superAdminUserPath(id), buildNetworkUserUpdateBody(values, userType));

  return normalizeUserDetail(data.data);
}

export async function deleteUserById(id: string): Promise<void> {
  await superAdminModuleClient.delete(superAdminUserPath(id));
}

function mapAdminEditValuesToFormValues(values: AdminEditValues): UserFormValues {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    mobile: values.mobile,
    password: "",
    alternateMobileNumber: values.alternateMobileNumber || "",
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
    panNumber: "",
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    profileImage: values.profileImage ?? null,
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
    ownerPhoto: null,
    videoVerification: null,
    passbookImage: null,
    cancelledChequeImage: null,
  };
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
  const hasFile = values.profileImage instanceof File;

  if (hasFile) {
    const formValues = mapAdminEditValuesToFormValues(values);
    const formData = buildUserFormData(
      formValues,
      { profileImage: values.profileImage as File },
      { userType: "ADMIN", includePassword: false }
    );
    if (values.status) {
      formData.append("status", values.status);
    }

    const { data } = await superAdminModuleClient.put<
      ApiResponse<AdminDetailRecord>
    >(superAdminUserPath(id), formData, multipartConfig);
    return normalizeAdminDetail(data.data);
  }

  const { data } = await superAdminModuleClient.put<
    ApiResponse<AdminDetailRecord>
  >(superAdminUserPath(id), buildAdminUpdateBody(values));

  return normalizeAdminDetail(data.data);
}
