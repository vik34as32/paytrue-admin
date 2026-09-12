import { ApiUserRecord } from "@/lib/buildUserFormData";
import { UserDetailRecord, NetworkUserRecord, UserOutletRecord } from "@/types/superAdmin";
import { getNetworkUserName } from "@/store/selectors/superAdminSelectors";
import { resolveMediaUrl } from "@/lib/utils";

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
      : obj.kycDocument && typeof obj.kycDocument === "object"
        ? (obj.kycDocument as Record<string, unknown>)
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

  const wallets = Array.isArray(obj.wallets) ? obj.wallets : [];
  const mainWalletFromList =
    (wallets.find((item) => {
      if (!item || typeof item !== "object") return false;
      return (
        String((item as Record<string, unknown>).walletType || "").toUpperCase() ===
        "MAIN"
      );
    }) as Record<string, unknown> | undefined) ||
    (wallets[0] && typeof wallets[0] === "object"
      ? (wallets[0] as Record<string, unknown>)
      : undefined);

  const walletBalance =
    parseAmount(obj.walletBalance) ??
    parseAmount(walletRecord?.balance) ??
    parseAmount(mainWalletFromList?.balance) ??
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

  const parentRaw =
    (obj.parentUser && typeof obj.parentUser === "object"
      ? (obj.parentUser as Record<string, unknown>)
      : null) ||
    (obj.parent && typeof obj.parent === "object"
      ? (obj.parent as Record<string, unknown>)
      : null);

  const distributorRaw =
    obj.distributor && typeof obj.distributor === "object"
      ? (obj.distributor as Record<string, unknown>)
      : parentRaw &&
          String(parentRaw.role || parentRaw.userType || "")
            .toUpperCase()
            .includes("DISTRIBUTOR") &&
          !String(parentRaw.role || parentRaw.userType || "")
            .toUpperCase()
            .includes("MASTER")
        ? parentRaw
        : undefined;

  const masterDistributorRaw =
    obj.masterDistributor && typeof obj.masterDistributor === "object"
      ? (obj.masterDistributor as Record<string, unknown>)
      : parentRaw &&
          String(parentRaw.role || parentRaw.userType || "")
            .toUpperCase()
            .includes("MASTER")
        ? parentRaw
        : undefined;

  const toHierarchyPerson = (
    raw?: Record<string, unknown> | null
  ): UserDetailRecord["parentUser"] => {
    if (!raw) return undefined;
    return {
      id: raw.id != null ? String(raw.id) : undefined,
      name: typeof raw.name === "string" ? raw.name : undefined,
      firstName: typeof raw.firstName === "string" ? raw.firstName : undefined,
      lastName: typeof raw.lastName === "string" ? raw.lastName : undefined,
      email: typeof raw.email === "string" ? raw.email : undefined,
      userType:
        typeof raw.userType === "string"
          ? raw.userType
          : typeof raw.role === "string"
            ? raw.role
            : undefined,
      userCode: typeof raw.userCode === "string" ? raw.userCode : undefined,
    };
  };

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
    verificationStatus:
      (obj.verificationStatus as string | undefined) ||
      (obj.verification && typeof obj.verification === "object"
        ? ((obj.verification as Record<string, unknown>).status as
            | string
            | undefined)
        : undefined) ||
      (obj.idVerification && typeof obj.idVerification === "object"
        ? ((obj.idVerification as Record<string, unknown>).status as
            | string
            | undefined)
        : undefined) ||
      (obj.isVerified === true
        ? "VERIFIED"
        : obj.isVerified === false
          ? "PENDING"
          : undefined),
    idVerificationStatus: obj.idVerificationStatus as string | undefined,
    verificationRemark: obj.verificationRemark as string | undefined,
    rejectionReason: obj.rejectionReason as string | undefined,
    verifiedAt: obj.verifiedAt as string | undefined,
    rejectedAt: obj.rejectedAt as string | undefined,
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
    parentUser: toHierarchyPerson(parentRaw),
    distributor: toHierarchyPerson(distributorRaw),
    masterDistributor: toHierarchyPerson(masterDistributorRaw),
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

/** Prefer firstName only (retailer lastName is often a random code). */
export function getUserFirstName(user: NetworkUserRecord): string {
  const first = (user.firstName || "").trim();
  if (first) return first;
  const full = (user.name || getNetworkUserName(user) || "").trim();
  if (!full) return "—";
  return full.split(/\s+/)[0] || full;
}

/** InstantPay outlet id when present, else outlet UUID. */
export function getUserOutletId(user: NetworkUserRecord): string {
  const outlet = user.outlet;
  if (outlet && typeof outlet === "object") {
    const instantpay = outlet.instantpayOutletId;
    if (instantpay !== null && instantpay !== undefined && `${instantpay}`.trim()) {
      return String(instantpay).trim();
    }
    if (outlet.id) return String(outlet.id);
  }
  const topLevel = (user as Record<string, unknown>).instantpayOutletId;
  if (typeof topLevel === "string" && topLevel.trim()) return topLevel.trim();
  return "—";
}

const HIDDEN_NETWORK_USER_EMAILS = new Set(["retailer@fintech.com"]);

export function isHiddenNetworkUser(user: NetworkUserRecord): boolean {
  const email = String(user.email || "")
    .trim()
    .toLowerCase();
  return HIDDEN_NETWORK_USER_EMAILS.has(email);
}

export function filterVisibleNetworkUsers(users: NetworkUserRecord[]): {
  users: NetworkUserRecord[];
  hiddenCount: number;
} {
  const visible: NetworkUserRecord[] = [];
  let hiddenCount = 0;
  for (const user of users) {
    if (isHiddenNetworkUser(user)) {
      hiddenCount += 1;
      continue;
    }
    visible.push(user);
  }
  return { users: visible, hiddenCount };
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

function pickKycImage(
  user: NetworkUserRecord,
  keys: string[]
): string | null {
  const kyc =
    user.kyc && typeof user.kyc === "object"
      ? (user.kyc as Record<string, unknown>)
      : {};
  for (const key of keys) {
    const value = kyc[key];
    if (typeof value === "string" && value.trim()) {
      return resolveMediaUrl(value.trim());
    }
  }
  for (const key of keys) {
    const value = (user as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) {
      return resolveMediaUrl(value.trim());
    }
  }
  return null;
}

export function getUserAadhaarFrontImage(
  user: NetworkUserRecord
): string | null {
  return pickKycImage(user, [
    "aadhaarFrontUrl",
    "aadhaarFrontImage",
    "aadhaarFront",
    "aadhaar_front",
  ]);
}

export function getUserAadhaarBackImage(
  user: NetworkUserRecord
): string | null {
  return pickKycImage(user, [
    "aadhaarBackUrl",
    "aadhaarBackImage",
    "aadhaarBack",
    "aadhaar_back",
  ]);
}

export function getUserPanCardImage(user: NetworkUserRecord): string | null {
  return pickKycImage(user, [
    "panCardUrl",
    "panCardImage",
    "panCard",
    "pan_card",
  ]);
}

export function getHierarchyLabel(user: UserDetailRecord): {
  parentUser?: string;
  distributor?: string;
  masterDistributor?: string;
} {
  const parentName =
    readNestedName(user.parentUser) ||
    (user.parentId ? `ID: ${user.parentId}` : undefined);
  const distributorName = readNestedName(user.distributor);
  const masterName = readNestedName(user.masterDistributor);

  return {
    parentUser: parentName,
    distributor: distributorName || undefined,
    masterDistributor: masterName || undefined,
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

export function getUserDateOfBirth(user: NetworkUserRecord): string {
  const outlet = user.outlet;
  const mini =
    outlet && typeof outlet === "object"
      ? (outlet as { miniKycResponse?: { data?: { dateOfBirth?: string }; requestSnapshot?: { dateOfBirth?: string } } })
          .miniKycResponse
      : undefined;
  const fromMini =
    mini?.data?.dateOfBirth || mini?.requestSnapshot?.dateOfBirth || "";
  const profile = user.profile;
  const fromProfile =
    profile && typeof profile === "object"
      ? profile.dateOfBirth || profile.dob
      : undefined;
  const top = (user as Record<string, unknown>).dateOfBirth;
  const value =
    (typeof fromMini === "string" && fromMini) ||
    (typeof fromProfile === "string" && fromProfile) ||
    (typeof top === "string" && top) ||
    "";
  const normalized = value.trim();
  if (!normalized) return "—";
  if (/^\d{4}-\d{2}-\d{2}/.test(normalized)) return normalized.slice(0, 10);
  return normalized;
}

export function getUserGender(user: NetworkUserRecord): "M" | "F" | "T" | "" {
  const outlet = user.outlet;
  const mini =
    outlet && typeof outlet === "object"
      ? (outlet as { miniKycResponse?: { data?: { gender?: string }; requestSnapshot?: { gender?: string } } })
          .miniKycResponse
      : undefined;
  const raw =
    mini?.data?.gender ||
    mini?.requestSnapshot?.gender ||
    (typeof (user as Record<string, unknown>).gender === "string"
      ? String((user as Record<string, unknown>).gender)
      : "") ||
    user.profile?.gender ||
    "";
  const upper = raw.trim().toUpperCase();
  if (upper === "M" || upper === "MALE") return "M";
  if (upper === "F" || upper === "FEMALE") return "F";
  if (upper === "T" || upper === "OTHER") return "T";
  return "";
}

export function getUserMiniKycStatus(user: NetworkUserRecord): string {
  const outlet = user.outlet;
  if (outlet && typeof outlet === "object" && outlet.miniKycStatus) {
    return String(outlet.miniKycStatus);
  }
  const top = (user as Record<string, unknown>).miniKycStatus;
  if (typeof top === "string" && top.trim()) return top.trim();
  return "—";
}

export function getUserKycCompletedAt(user: NetworkUserRecord): string {
  const outlet = user.outlet;
  if (outlet && typeof outlet === "object" && outlet.kycCompletedAt) {
    return String(outlet.kycCompletedAt);
  }
  const top = (user as Record<string, unknown>).kycCompletedAt;
  if (typeof top === "string" && top.trim()) return top.trim();
  return "";
}

export function getUserPassbookImage(user: NetworkUserRecord): string | null {
  const bank =
    user.bankAccount && typeof user.bankAccount === "object"
      ? (user.bankAccount as Record<string, unknown>)
      : {};
  const raw =
    (typeof bank.passbookImage === "string" && bank.passbookImage) ||
    (typeof bank.passbookUrl === "string" && bank.passbookUrl) ||
    null;
  return resolveMediaUrl(raw);
}

export function getUserCancelledChequeImage(
  user: NetworkUserRecord
): string | null {
  const bank =
    user.bankAccount && typeof user.bankAccount === "object"
      ? (user.bankAccount as Record<string, unknown>)
      : {};
  const raw =
    (typeof bank.cancelledChequeImage === "string" &&
      bank.cancelledChequeImage) ||
    (typeof bank.cancelledChequeUrl === "string" && bank.cancelledChequeUrl) ||
    null;
  return resolveMediaUrl(raw);
}

export function userDetailToApiRecord(user: UserDetailRecord): ApiUserRecord {
  const miniGender =
    user.outlet?.miniKycResponse?.data?.gender ||
    user.outlet?.miniKycResponse?.requestSnapshot?.gender;
  const miniDob =
    user.outlet?.miniKycResponse?.data?.dateOfBirth ||
    user.outlet?.miniKycResponse?.requestSnapshot?.dateOfBirth;
  const raw = user as Record<string, unknown>;
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    mobile: user.mobile,
    alternateMobileNumber: user.alternateMobileNumber,
    gender:
      (typeof miniGender === "string" && miniGender) ||
      (typeof raw.gender === "string" && raw.gender) ||
      user.profile?.gender ||
      undefined,
    dateOfBirth:
      (typeof miniDob === "string" && miniDob) ||
      (typeof raw.dateOfBirth === "string" && raw.dateOfBirth) ||
      user.profile?.dateOfBirth ||
      user.profile?.dob ||
      undefined,
    profileImage: user.profileImage,
    state: user.state,
    city: user.city,
    outlet: user.outlet,
    kyc: user.kyc,
    bankAccount: user.bankAccount,
    profile: user.profile,
  };
}

export { getNetworkUserName };
