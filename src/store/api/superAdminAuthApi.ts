import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  superAdminLogin as superAdminLoginService,
  superAdminLogout as superAdminLogoutService,
  getStoredSuperAdminUser,
  getSuperAdminToken,
} from "@/services/superAdminAuth";
import { SuperAdminLoginPayload } from "@/types/superAdmin";
import { fetchWalletBalance } from "@/store/api/superAdminWalletApi";
import { fetchDashboard } from "@/store/api/superAdminApi";

export const superAdminLogin = createAsyncThunk(
  "superAdminAuth/login",
  async (credentials: SuperAdminLoginPayload, { rejectWithValue, dispatch }) => {
    try {
      const result = await superAdminLoginService(credentials);
      await dispatch(fetchWalletBalance({ force: true }));
      await dispatch(fetchDashboard({ force: true }));
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Login failed"
      );
    }
  }
);

export const superAdminLogout = createAsyncThunk(
  "superAdminAuth/logout",
  async () => {
    superAdminLogoutService();
  }
);

export const loadStoredSuperAdmin = createAsyncThunk(
  "superAdminAuth/loadStored",
  async (_, { dispatch }) => {
    const token = getSuperAdminToken();
    const user = getStoredSuperAdminUser();
    if (!token || !user) return null;

    // Restore session immediately; fetch wallet/dashboard in background.
    void dispatch(fetchWalletBalance({ force: true }));
    void dispatch(fetchDashboard({ force: true }));

    return { accessToken: token, user };
  }
);
