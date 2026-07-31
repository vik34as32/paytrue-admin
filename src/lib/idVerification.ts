import {
  IdVerificationStatus,
  UserVerificationInfo,
  VerificationActor,
  VerificationHistoryItem,
} from "@/types/idVerification";

export function normalizeVerificationStatus(
  raw: unknown
): IdVerificationStatus {
  const value = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  if (
    value === "VERIFIED" ||
    value === "APPROVED" ||
    value === "SUCCESS"
  ) {
    return "VERIFIED";
  }
  if (
    value === "REJECTED" ||
    value === "REJECT" ||
    value === "FAILED" ||
    value === "DECLINED"
  ) {
    return "REJECTED";
  }
  return "PENDING";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function pickString(
  source: Record<string, unknown> | null | undefined,
  ...keys: string[]
): string | undefined {
  if (!source) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function normalizeActor(raw: unknown): VerificationActor | null {
  const obj = asRecord(raw);
  if (!obj) return null;

  const nestedUser = asRecord(obj.user) || asRecord(obj.admin);
  const firstName = pickString(obj, "firstName") || pickString(nestedUser, "firstName");
  const lastName = pickString(obj, "lastName") || pickString(nestedUser, "lastName");
  const combinedName = [firstName, lastName].filter(Boolean).join(" ").trim();

  const name =
    pickString(obj, "name", "fullName", "adminName") ||
    pickString(nestedUser, "name", "fullName") ||
    combinedName ||
    undefined;

  const email =
    pickString(obj, "email", "adminEmail") ||
    pickString(nestedUser, "email") ||
    undefined;

  const role =
    pickString(obj, "role", "userType", "adminRole") ||
    pickString(nestedUser, "role", "userType") ||
    undefined;

  const id =
    pickString(obj, "id", "userId", "adminId") ||
    pickString(nestedUser, "id") ||
    undefined;

  if (!name && !email && !role && !id) return null;
  return { id, name, email, role };
}

function normalizeHistory(raw: unknown): VerificationHistoryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const obj = asRecord(item) || {};
    return {
      id: pickString(obj, "id") || String(index),
      action: pickString(obj, "action", "type", "event"),
      status: pickString(obj, "status"),
      remark: pickString(obj, "remark", "remarks", "message") || null,
      reason: pickString(obj, "reason", "rejectionReason") || null,
      createdAt:
        pickString(obj, "createdAt", "updatedAt", "timestamp", "at") || null,
      actor: normalizeActor(
        obj.actor || obj.by || obj.user || obj.admin || obj.performedBy
      ),
    };
  });
}

/** Raw verification status string from API payload (if present). */
export function getUserVerificationStatusRaw(user: unknown): string | null {
  const obj = asRecord(user);
  if (!obj) return null;

  const verification = asRecord(obj.verification);
  const idVerification = asRecord(obj.idVerification);
  const kyc = asRecord(obj.kyc);

  const raw =
    pickString(
      obj,
      "verificationStatus",
      "idVerificationStatus",
      "verification_status",
      "identityVerificationStatus",
      "kycStatus"
    ) ||
    pickString(verification, "status") ||
    pickString(idVerification, "status") ||
    pickString(kyc, "kycStatus", "status");

  if (raw) return raw;

  if (obj.isVerified === true || obj.verified === true) return "VERIFIED";
  if (obj.isVerified === false || obj.verified === false) return "PENDING";

  return null;
}

/** Extract verification status from a list/detail user payload. */
export function getUserVerificationStatus(user: unknown): IdVerificationStatus {
  return normalizeVerificationStatus(getUserVerificationStatusRaw(user));
}

/** Display label — prefer exact API status text when available. */
export function getUserVerificationDisplayLabel(user: unknown): string {
  const raw = getUserVerificationStatusRaw(user);
  if (raw) {
    const normalized = normalizeVerificationStatus(raw);
    // Keep known statuses as friendly labels; otherwise show API value as-is.
    if (
      ["VERIFIED", "APPROVED", "SUCCESS", "REJECTED", "REJECT", "FAILED", "DECLINED", "PENDING"].includes(
        raw.trim().toUpperCase().replace(/\s+/g, "_")
      )
    ) {
      return verificationStatusLabel(normalized);
    }
    return raw.trim();
  }
  return verificationStatusLabel(getUserVerificationStatus(user));
}

export function normalizeUserVerification(
  userId: string,
  payload: unknown
): UserVerificationInfo {
  const root = asRecord(payload);
  const data =
    asRecord(root?.data) ||
    asRecord(root?.verification) ||
    asRecord(root?.idVerification) ||
    root ||
    {};

  const verifiedBy = normalizeActor(
    data.verifiedBy ||
      data.verified_by ||
      data.verifiedByAdmin ||
      data.admin ||
      data.verifier
  );

  const rejectedBy = normalizeActor(
    data.rejectedBy || data.rejected_by || data.rejectedByAdmin || data.rejector
  );

  const status = normalizeVerificationStatus(
    data.status ||
      data.verificationStatus ||
      data.idVerificationStatus ||
      data.state
  );

  return {
    userId,
    status,
    remark:
      pickString(data, "remark", "remarks", "verificationRemark", "message") ||
      null,
    reason:
      pickString(
        data,
        "reason",
        "rejectionReason",
        "rejectedReason",
        "rejectReason"
      ) || null,
    verifiedAt:
      pickString(data, "verifiedAt", "verified_at", "verifiedOn") || null,
    rejectedAt:
      pickString(data, "rejectedAt", "rejected_at", "rejectedOn") || null,
    verifiedBy,
    rejectedBy,
    history: normalizeHistory(data.history || data.logs || data.events),
    raw: payload,
  };
}

export function verificationStatusLabel(status: IdVerificationStatus): string {
  switch (status) {
    case "VERIFIED":
      return "Verified";
    case "REJECTED":
      return "Rejected";
    default:
      return "Pending";
  }
}
