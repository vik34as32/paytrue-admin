import { STORAGE_KEYS } from "@/constants/storage";

const LOGIN_TOKEN_KEY = STORAGE_KEYS.LOGIN_TOKEN;
const REMEMBER_ME_KEY = STORAGE_KEYS.LOGIN_REMEMBER_ME;

/** Temporary loginToken for OTP step — sessionStorage only, never JWT. */
export function setLoginToken(loginToken: string, rememberMe = true) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LOGIN_TOKEN_KEY, loginToken);
  sessionStorage.setItem(REMEMBER_ME_KEY, rememberMe ? "1" : "0");
}

export function getLoginToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(LOGIN_TOKEN_KEY);
}

export function getLoginRememberMe(): boolean {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(REMEMBER_ME_KEY) !== "0";
}

export function clearLoginToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(LOGIN_TOKEN_KEY);
  sessionStorage.removeItem(REMEMBER_ME_KEY);
}
