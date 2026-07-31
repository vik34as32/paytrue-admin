export const STORAGE_KEYS = {
  SUPER_ADMIN_TOKEN: "superAdminToken",
  SUPER_ADMIN_USER: "superAdminUser",
  SUPER_ADMIN_REFRESH_TOKEN: "superAdminRefreshToken",
  ADMIN_TOKEN: "adminToken",
  ADMIN_USER: "adminUser",
  ADMIN_REFRESH_TOKEN: "adminRefreshToken",
  /** Temporary token between password login and OTP verify — sessionStorage only */
  LOGIN_TOKEN: "loginToken",
  LOGIN_REMEMBER_ME: "loginRememberMe",
  /** @deprecated legacy mock auth keys — kept for existing mock flows */
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
} as const;

export type AuthTokenKey =
  | typeof STORAGE_KEYS.SUPER_ADMIN_TOKEN
  | typeof STORAGE_KEYS.ADMIN_TOKEN;
