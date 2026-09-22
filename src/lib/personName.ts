const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const USER_CODE_RE =
  /^(RET|DIS|DIST|MD|MST|ADM|USR|RTL|DST)[A-Z0-9]*\d+[A-Z0-9]*$/i;

/** UUID parent / user ids that APIs accept. */
export function isUuid(value?: string | null): boolean {
  return UUID_RE.test(String(value || "").trim());
}

/**
 * System codes (userCode, InstantPay lastName, UUIDs) — not a person's name.
 * These must not show on view/edit profile and must not go in edit payloads.
 */
export function isAlphanumericSystemCode(value?: string | null): boolean {
  const raw = String(value || "").trim();
  if (!raw) return false;
  if (UUID_RE.test(raw)) return true;
  if (USER_CODE_RE.test(raw)) return true;
  if (raw.startsWith("ID:")) return true;
  if (!/\s/.test(raw) && /[A-Za-z]/.test(raw) && /\d/.test(raw) && raw.length >= 4) {
    return true;
  }
  return false;
}

export function sanitizePersonNamePart(value?: string | null): string {
  const raw = String(value || "").trim();
  if (!raw || isAlphanumericSystemCode(raw)) return "";
  return raw
    .split(/\s+/)
    .filter((token) => !isAlphanumericSystemCode(token))
    .join(" ")
    .trim();
}

export function sanitizePersonName(
  ...parts: Array<string | null | undefined>
): string {
  const tokens: string[] = [];
  for (const part of parts) {
    const cleaned = sanitizePersonNamePart(part);
    if (!cleaned) continue;
    for (const token of cleaned.split(/\s+/).filter(Boolean)) {
      const prev = tokens[tokens.length - 1];
      if (!prev || prev.toLowerCase() !== token.toLowerCase()) {
        tokens.push(token);
      }
    }
  }
  return tokens.join(" ");
}

export function uuidOrEmpty(value?: string | null): string {
  const raw = String(value || "").trim();
  return isUuid(raw) ? raw : "";
}
