import { createAsyncThunk } from "@reduxjs/toolkit";

import {
  adminLogin,
  adminLogout,
  getAdminToken,
  getStoredAdminUser,
} from "@/services/adminAuth";

import { AdminLoginPayload } from "@/types/superAdmin";



/** Real admin API login — stores adminToken separately */

export const adminLoginUser = createAsyncThunk(

  "auth/adminLogin",

  async (

    payload: AdminLoginPayload & { rememberMe?: boolean },

    { rejectWithValue, dispatch }

  ) => {

    try {

      const { rememberMe, ...credentials } = payload;

      const result = await adminLogin(credentials, rememberMe ?? true);
      return result;

    } catch (error) {

      return rejectWithValue(

        error instanceof Error ? error.message : "Login failed"

      );

    }

  }

);



export const logoutUser = createAsyncThunk("auth/logout", async () => {

  adminLogout();

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

