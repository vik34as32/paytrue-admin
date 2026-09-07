export const GENDER_OPTIONS = [
  { value: "", label: "Select gender" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;

export function getGenderLabel(value?: string): string {
  if (!value) return "—";
  const match = GENDER_OPTIONS.find((o) => o.value === value);
  return match?.label || value;
}
