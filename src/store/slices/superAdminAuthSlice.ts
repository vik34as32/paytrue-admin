import { createSlice } from "@reduxjs/toolkit";
import { SuperAdminProfile } from "@/types/superAdmin";
import {
  superAdminLogin,
  superAdminLogout,
  loadStoredSuperAdmin,
} from "@/store/api/superAdminAuthApi";

interface SuperAdminAuthState {
  user: SuperAdminProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: SuperAdminAuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const superAdminAuthSlice = createSlice({
  name: "superAdminAuth",
  initialState,
  reducers: {
    clearSuperAdminError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(superAdminLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(superAdminLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(superAdminLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(superAdminLogout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      .addCase(loadStoredSuperAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredSuperAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.isAuthenticated = true;
        }
      })
      .addCase(loadStoredSuperAdmin.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { clearSuperAdminError } = superAdminAuthSlice.actions;
export default superAdminAuthSlice.reducer;
