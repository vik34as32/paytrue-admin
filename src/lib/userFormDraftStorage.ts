import type {
  AdminCreateUserType,
  UserFormValues,
} from "@/validations/userStepSchemas";

const STORAGE_PREFIX = "paytrue-user-form-draft";

const FILE_FIELDS = [
  "profileImage",
  "aadhaarFront",
  "aadhaarBack",
  "panCard",
  "ownerPhoto",
  "videoVerification",
  "passbookImage",
  "cancelledChequeImage",
] as const satisfies ReadonlyArray<keyof UserFormValues>;

type FileField = (typeof FILE_FIELDS)[number];

interface StoredFile {
  name: string;
  type: string;
  dataUrl: string;
}

type StoredFormValues = Omit<UserFormValues, FileField> & {
  [K in FileField]: StoredFile | null;
};

export interface UserFormDraft {
  step: number;
  maxStepReached: number;
  values: UserFormValues;
  savedAt: number;
}

interface StoredDraft {
  step: number;
  maxStepReached: number;
  values: StoredFormValues;
  savedAt: number;
}

export function getUserFormDraftKey(userType: AdminCreateUserType) {
  return `${STORAGE_PREFIX}:${userType}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function serializeFile(file: File | null): Promise<StoredFile | null> {
  if (!(file instanceof File)) return null;
  return {
    name: file.name,
    type: file.type,
    dataUrl: await readFileAsDataUrl(file),
  };
}

function deserializeFile(stored: StoredFile | null): File | null {
  if (!stored?.dataUrl) return null;

  const [header, base64] = stored.dataUrl.split(",");
  if (!base64) return null;

  const mimeType =
    stored.type || header.match(/:(.*?);/)?.[1] || "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], stored.name, { type: mimeType });
}

async function serializeValues(
  values: UserFormValues
): Promise<StoredFormValues> {
  const storedValues = { ...values } as StoredFormValues;

  for (const field of FILE_FIELDS) {
    storedValues[field] = await serializeFile(values[field] as File | null);
  }

  return storedValues;
}

function deserializeValues(storedValues: StoredFormValues): UserFormValues {
  const values = { ...storedValues } as UserFormValues;

  for (const field of FILE_FIELDS) {
    values[field] = deserializeFile(storedValues[field]);
  }

  return values;
}

export function clearUserFormDraft(userType: AdminCreateUserType) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getUserFormDraftKey(userType));
}

export async function loadUserFormDraft(
  userType: AdminCreateUserType
): Promise<UserFormDraft | null> {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(getUserFormDraftKey(userType));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredDraft;
    return {
      step: parsed.step,
      maxStepReached: parsed.maxStepReached,
      values: deserializeValues(parsed.values),
      savedAt: parsed.savedAt,
    };
  } catch {
    clearUserFormDraft(userType);
    return null;
  }
}

export async function saveUserFormDraft(
  userType: AdminCreateUserType,
  draft: Pick<UserFormDraft, "step" | "maxStepReached" | "values">
) {
  if (typeof window === "undefined") return;

  try {
    const payload: StoredDraft = {
      step: draft.step,
      maxStepReached: draft.maxStepReached,
      values: await serializeValues(draft.values),
      savedAt: Date.now(),
    };

    window.localStorage.setItem(
      getUserFormDraftKey(userType),
      JSON.stringify(payload)
    );
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" || error.code === 22)
    ) {
      const textOnlyValues = { ...draft.values } as StoredFormValues;
      for (const field of FILE_FIELDS) {
        textOnlyValues[field] = null;
      }

      const fallbackPayload: StoredDraft = {
        step: draft.step,
        maxStepReached: draft.maxStepReached,
        values: textOnlyValues,
        savedAt: Date.now(),
      };

      window.localStorage.setItem(
        getUserFormDraftKey(userType),
        JSON.stringify(fallbackPayload)
      );
      return;
    }

    console.error("Failed to save form draft", error);
  }
}
