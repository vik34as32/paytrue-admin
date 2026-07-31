import { createAsyncThunk } from "@reduxjs/toolkit";

import {
  adminLogin,
  adminLogout,
  getAdminToken,
  getStoredAdminUser,
} from "@/services/adminAuth";
import { clearLoginToken } from "@/lib/loginToken";
import { clearAllAuthCookies } from "@/lib/authCookie";

import { AdminLoginPayload } from "@/types/superAdmin";

/** Real admin API login — may return OTP challenge or authenticated session */
export const adminLoginUser = createAsyncThunk(
  "auth/adminLogin",
  async (
    payload: AdminLoginPayload & { rememberMe?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const { rememberMe, ...credentials } = payload;
      return await adminLogin(credentials, rememberMe ?? true);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Login failed"
      );
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  adminLogout();
  clearLoginToken();
  clearAllAuthCookies();
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
});

export const loadStoredUser = createAsyncThunk("auth/loadUser", async () => {
  const adminUser = getStoredAdminUser();
  const accessToken = getAdminToken();

  if (adminUser && accessToken) {
    return { user: adminUser, accessToken };
  }

  return null;
});
