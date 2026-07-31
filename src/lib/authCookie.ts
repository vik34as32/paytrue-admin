import { STORAGE_KEYS } from "@/constants/storage";

const AUTH_COOKIE = STORAGE_KEYS.ADMIN_TOKEN;
const SUPER_ADMIN_COOKIE = STORAGE_KEYS.SUPER_ADMIN_TOKEN;

function setCookie(name: string, value: string, rememberMe: boolean) {
  if (typeof document === "undefined") return;
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : undefined;
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "path=/",
    "SameSite=Lax",
  ];
  if (maxAge) parts.push(`max-age=${maxAge}`);
  document.cookie = parts.join("; ");
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

/** Sync JWT into a cookie so Next.js middleware can protect routes. */
export function setAuthTokenCookie(token: string, rememberMe = true) {
  setCookie(AUTH_COOKIE, token, rememberMe);
}

export function clearAuthTokenCookie() {
  clearCookie(AUTH_COOKIE);
}

export function setSuperAdminTokenCookie(token: string) {
  setCookie(SUPER_ADMIN_COOKIE, token, true);
}

export function clearSuperAdminTokenCookie() {
  clearCookie(SUPER_ADMIN_COOKIE);
}

export function clearAllAuthCookies() {
  clearAuthTokenCookie();
  clearSuperAdminTokenCookie();
}
