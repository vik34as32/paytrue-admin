export function maskMobile(mobile?: string): string {
  const digits = String(mobile || "").replace(/\D/g, "");
  if (digits.length < 4) return mobile || "—";
  return `${digits.slice(0, 2)}${"X".repeat(Math.max(digits.length - 4, 4))}${digits.slice(-2)}`;
}

export function isActiveStatus(status?: string): boolean {
  return String(status || "ACTIVE").toUpperCase() === "ACTIVE";
}
