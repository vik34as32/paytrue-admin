export const GENDER_OPTIONS = [
  { value: "", label: "Select gender" },
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "T", label: "Other" },
] as const;

const GENDER_LABELS: Record<string, string> = {
  M: "Male",
  F: "Female",
  T: "Other",
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

export function getGenderLabel(value?: string): string {
  if (!value) return "—";
  return GENDER_LABELS[value.toUpperCase()] || value;
}

/** API expects M | F | T */
export function toApiGender(value?: string): "M" | "F" | "T" | "" {
  const raw = (value || "").trim().toUpperCase();
  if (raw === "M" || raw === "MALE") return "M";
  if (raw === "F" || raw === "FEMALE") return "F";
  if (raw === "T" || raw === "OTHER") return "T";
  return "";
}
