import { createAsyncThunk } from "@reduxjs/toolkit";
import { mockApi } from "@/services/mockApi";
import { LoginCredentials, AuthUser } from "@/types";

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await mockApi.login(credentials);
      if (credentials.rememberMe) {
        localStorage.setItem("accessToken", response.accessToken);
        localStorage.setItem("refreshToken", response.refreshToken);
      } else {
        sessionStorage.setItem("accessToken", response.accessToken);
        sessionStorage.setItem("refreshToken", response.refreshToken);
      }
      localStorage.setItem("user", JSON.stringify(response.user));
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Login failed"
      );
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
});

export const loadStoredUser = createAsyncThunk("auth/loadUser", async () => {
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  return JSON.parse(stored) as AuthUser;
});
