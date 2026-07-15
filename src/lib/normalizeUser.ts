import { ApiUserRecord } from "@/lib/buildUserFormData";
import { UserDetailRecord, NetworkUserRecord, UserOutletRecord } from "@/types/superAdmin";
import { getNetworkUserName } from "@/store/selectors/superAdminSelectors";

function parseAmount(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readNestedName(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  if (typeof obj.name === "string" && obj.name) return obj.name;
  const full = [obj.firstName, obj.lastName].filter(Boolean).join(" ");
  return full || (typeof obj.email === "string" ? obj.email : undefined);
}

function readNestedCode(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const code = (value as Record<string, unknown>).userCode;
  return typeof code === "string" ? code : undefined;
}

function pickStr(
  source: Record<string, unknown> | undefined,
  ...keys: string[]
): string | undefined {
  if (!source) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export function normalizeUserDetail(raw: unknown): UserDetailRecord {
  if (!raw || typeof raw !== "object") {
    return { id: "" };
  }

  const obj = raw as Record<string, unknown>;
  const profile =
    obj.profile && typeof obj.profile === "object"
      ? obj.profile
      : undefined;
  const wallet =
    obj.wallet && typeof obj.wallet === "object" ? obj.wallet : undefined;
  const outlet =
    obj.outlet && typeof obj.outlet === "object"
      ? (obj.outlet as ApiUserRecord["outlet"])
      : undefined;
  const kycRaw =
    obj.kyc && typeof obj.kyc === "object"
      ? (obj.kyc as Record<string, unknown>)
      : undefined;

  const aadhaarNumber =
    pickStr(kycRaw, "aadhaarNumber", "aadhaar", "aadhaar_number") ||
    pickStr(obj, "aadhaarNumber", "aadhaar", "aadhaar_number");
  const panNumber =
    pickStr(kycRaw, "panNumber", "pan", "pan_number") ||
    pickStr(obj, "panNumber", "pan", "pan_number");

  const aadhaarFrontImage =
    pickStr(
      kycRaw,
      "aadhaarFrontUrl",
      "aadhaarFrontImage",
      "aadhaarFront",
      "aadhaar_front",
      "aadhaar_front_image",
      "aadhaar_front_url"
    ) ||
    pickStr(
      obj,
      "aadhaarFrontUrl",
      "aadhaarFrontImage",
      "aadhaarFront",
      "aadhaar_front_url"
    );
  const aadhaarBackImage =
    pickStr(
      kycRaw,
      "aadhaarBackUrl",
      "aadhaarBackImage",
      "aadhaarBack",
      "aadhaar_back",
      "aadhaar_back_image",
      "aadhaar_back_url"
    ) ||
    pickStr(
      obj,
      "aadhaarBackUrl",
      "aadhaarBackImage",
      "aadhaarBack",
      "aadhaar_back_url"
    );
  const panCardImage =
    pickStr(
      kycRaw,
      "panCardUrl",
      "panCardImage",
      "panCard",
      "pan_card",
      "pan_card_image",
      "pan_card_url"
    ) ||
    pickStr(obj, "panCardUrl", "panCardImage", "panCard", "pan_card_url");
  const ownerPhoto =
    pickStr(
      kycRaw,
      "ownerPhotoUrl",
      "ownerPhoto",
      "owner_photo",
      "owner_photo_url"
    ) || pickStr(obj, "ownerPhotoUrl", "ownerPhoto", "owner_photo_url");
  const videoVerification =
    pickStr(
      kycRaw,
      "videoVerificationUrl",
      "videoVerification",
      "video_verification",
      "video_verification_url"
    ) ||
    pickStr(obj, "videoVerificationUrl", "videoVerification");

  const kyc =
    kycRaw || aadhaarNumber || panNumber || aadhaarFrontImage || panCardImage
      ? ({
          ...(kycRaw || {}),
          aadhaarNumber,
          panNumber,
          aadhaarFrontImage,
          aadhaarBackImage,
          panCardImage,
          ownerPhoto,
          videoVerification,
          aadhaarFrontUrl: aadhaarFrontImage,
          aadhaarBackUrl: aadhaarBackImage,
          panCardUrl: panCardImage,
          ownerPhotoUrl: ownerPhoto,
          kycStatus:
            pickStr(kycRaw, "kycStatus", "status") ||
            pickStr(obj, "kycStatus"),
        } as ApiUserRecord["kyc"] & {
          kycStatus?: string;
          status?: string;
          aadhaarFrontImage?: string;
          aadhaarBackImage?: string;
          panCardImage?: string;
          ownerPhoto?: string;
          aadhaarFrontUrl?: string;
          aadhaarBackUrl?: string;
          panCardUrl?: string;
          ownerPhotoUrl?: string;
          videoVerification?: string;
        })
      : undefined;
  const bankAccount =
    obj.bankAccount && typeof obj.bankAccount === "object"
      ? (obj.bankAccount as ApiUserRecord["bankAccount"])
      : undefined;

  const profileRecord = profile as Record<string, unknown> | undefined;
  const walletRecord = wallet as Record<string, unknown> | undefined;

  const walletBalance =
    parseAmount(obj.walletBalance) ??
    parseAmount(walletRecord?.balance) ??
    parseAmount(
      walletRecord?.wallet && typeof walletRecord.wallet === "object"
        ? (walletRecord.wallet as Record<string, unknown>).balance
        : undefined
    );

  const profileImage =
    (profileRecord?.profileImage as string | undefined) ??
    (obj.profileImage as string | undefined);

  const alternateMobileNumber =
    (profileRecord?.alternateMobileNumber as string | undefined) ??
    (obj.alternateMobileNumber as string | undefined);

  const mobile =
    (obj.mobile as string | undefined) ||
    (obj.phone as string | undefined) ||
    undefined;

  const outletNormalized = outlet
    ? {
        ...outlet,
        outletImage:
          (outlet as Record<string, unknown>).outletImage ??
          (outlet as Record<string, unknown>).outletPhoto ??
          (outlet as Record<string, unknown>).shopImage ??
          (outlet as Record<string, unknown>).image,
      }
    : undefined;

  return {
    id: String(obj.id ?? obj._id ?? ""),
    firstName: obj.firstName as string | undefined,
    lastName: obj.lastName as string | undefined,
    name:
      (obj.name as string | undefined) ||
      [obj.firstName, obj.lastName].filter(Boolean).join(" ") ||
      undefined,
    email: obj.email as string | undefined,
    mobile,
    phone: (obj.phone as string | undefined) || mobile,
    alternateMobileNumber,
    profileImage,
    status: obj.status as string | undefined,
    userType:
      (obj.userType as string | undefined) ||
      (obj.role as string | undefined) ||
      undefined,
    role: obj.role as string | undefined,
    userCode: obj.userCode as string | undefined,
    businessName:
      (obj.businessName as string | undefined) ?? outlet?.outletName,
    city: (obj.city as string | undefined) ?? outlet?.city,
    state: (obj.state as string | undefined) ?? outlet?.state,
    parentId: obj.parentId as string | undefined,
    createdById: obj.createdById as string | undefined,
    tenantId: (obj.tenantId as string | null | undefined) ?? null,
    lastLoginAt: obj.lastLoginAt as string | undefined,
    lastLoginIp: obj.lastLoginIp as string | undefined,
    isEmailVerified: obj.isEmailVerified as boolean | undefined,
    mobileVerified: obj.mobileVerified as boolean | undefined,
    mobileVerifiedAt: obj.mobileVerifiedAt as string | undefined,
    createdAt: obj.createdAt as string | undefined,
    updatedAt: obj.updatedAt as string | undefined,
    deletedAt: (obj.deletedAt as string | null | undefined) ?? null,
    walletBalance,
    profile: profileRecord as UserDetailRecord["profile"],
    wallet: walletRecord as UserDetailRecord["wallet"],
    outlet: outletNormalized as UserDetailRecord["outlet"],
    kyc,
    bankAccount,
    parentUser: obj.parentUser as UserDetailRecord["parentUser"],
    distributor: obj.distributor as UserDetailRecord["distributor"],
    masterDistributor: obj.masterDistributor as UserDetailRecord["masterDistributor"],
    kycStatus:
      (kyc?.kycStatus as string | undefined) ??
      (kyc?.status as string | undefined) ??
      ((outlet as UserOutletRecord | undefined)?.miniKycStatus as
        | string
        | undefined) ??
      (obj.kycStatus as string | undefined),
    aadhaarNumber,
    panNumber,
  };
}

export function normalizeNetworkUserRecord(raw: unknown): NetworkUserRecord {
  return normalizeUserDetail(raw);
}

export function getUserOutletName(user: NetworkUserRecord): string {
  if (user.businessName) return user.businessName;
  const outlet = user.outlet;
  if (outlet && typeof outlet === "object" && outlet.outletName) {
    return String(outlet.outletName);
  }
  if (user.outletName) return String(user.outletName);
  return "—";
}

export function getUserOutletField(
  user: NetworkUserRecord,
  field: keyof NonNullable<NetworkUserRecord["outlet"]> | "state" | "city" | "address"
): string {
  const outlet = user.outlet;
  if (outlet && typeof outlet === "object" && field in outlet) {
    const value = outlet[field as keyof typeof outlet];
    if (value !== null && value !== undefined && value !== "") {
      return String(value);
    }
  }
  if (field === "state" && user.state) return String(user.state);
  if (field === "city" && user.city) return String(user.city);
  return "—";
}

export function getUserAadhaarNumber(user: NetworkUserRecord): string {
  const kyc = user.kyc;
  if (kyc && typeof kyc === "object" && kyc.aadhaarNumber) {
    return String(kyc.aadhaarNumber);
  }
  if (user.aadhaarNumber) return String(user.aadhaarNumber);
  return "—";
}

export function getUserPanNumber(user: NetworkUserRecord): string {
  const kyc = user.kyc;
  if (kyc && typeof kyc === "object" && kyc.panNumber) {
    return String(kyc.panNumber);
  }
  if (user.panNumber) return String(user.panNumber);
  return "—";
}

export function getHierarchyLabel(user: UserDetailRecord): {
  parentUser?: string;
  distributor?: string;
  masterDistributor?: string;
} {
  return {
    parentUser:
      readNestedName(user.parentUser) ||
      (user.parentId ? `ID: ${user.parentId}` : undefined),
    distributor: readNestedName(user.distributor),
    masterDistributor: readNestedName(user.masterDistributor),
  };
}

export function getUserDisplayRole(user: UserDetailRecord): string {
  return user.userType || user.role || "—";
}

export function formatUserTypeLabel(userType?: string): string {
  if (!userType) return "—";
  return userType
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatBooleanLabel(value?: boolean): string {
  if (value === undefined || value === null) return "—";
  return value ? "Yes" : "No";
}

export function getWalletBalance(user: UserDetailRecord): number {
  return user.walletBalance ?? parseAmount(user.wallet?.balance) ?? 0;
}

export function userDetailToApiRecord(user: UserDetailRecord): ApiUserRecord {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    mobile: user.mobile,
    alternateMobileNumber: user.alternateMobileNumber,
    profileImage: user.profileImage,
    state: user.state,
    city: user.city,
    outlet: user.outlet,
    kyc: user.kyc,
    bankAccount: user.bankAccount,
  };
}

export { getNetworkUserName };
