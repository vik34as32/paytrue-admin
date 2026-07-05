import { STORAGE_KEYS } from "@/constants/storage";

/** Prevents 401 interceptors from clearing session during initial auth hydration. */
let authHydrationComplete = false;

/** Grace period after admin login — avoids redirect from prefetch API 401 races. */
let adminLoginAt = 0;
const ADMIN_LOGIN_GRACE_MS = 15_000;

export function markAdminLoginSuccess() {
  adminLoginAt = Date.now();
}

export function isWithinAdminLoginGracePeriod() {
  return adminLoginAt > 0 && Date.now() - adminLoginAt < ADMIN_LOGIN_GRACE_MS;
}

export function markAuthHydrationComplete() {
  authHydrationComplete = true;
}

export function resetAuthHydrationComplete() {
  authHydrationComplete = false;
}

export function isAuthHydrationComplete() {
  return authHydrationComplete;
}

export function hasPersistedAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  const hasUser = !!localStorage.getItem(STORAGE_KEYS.ADMIN_USER);
  const hasToken =
    !!localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) ||
    !!sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
  return hasUser && hasToken;
}

export function hasPersistedSuperAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  return (
    !!localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN) &&
    !!localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_USER)
  );
}

function clearAdminTokens() {
  localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
  localStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
}

function clearSuperAdminTokens() {
  localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_USER);
  localStorage.removeItem(STORAGE_KEYS.SUPER_ADMIN_REFRESH_TOKEN);
}

export function clearAdminAuthStorage() {
  clearAdminTokens();
}

export function clearSuperAdminAuthStorage() {
  clearSuperAdminTokens();
}

export function clearAllAuthStorage() {
  clearAdminTokens();
  clearSuperAdminTokens();
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function handleUnauthorizedRedirect(loginPath: string, tokenKey: string) {
  if (!isAuthHydrationComplete()) {
    return false;
  }

  if (
    tokenKey === STORAGE_KEYS.ADMIN_TOKEN &&
    isWithinAdminLoginGracePeriod()
  ) {
    return false;
  }

  if (tokenKey === STORAGE_KEYS.SUPER_ADMIN_TOKEN) {
    clearSuperAdminAuthStorage();
  } else {
    clearAdminAuthStorage();
  }

  if (
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith(loginPath)
  ) {
    window.location.href = loginPath;
  }

  return true;
}
