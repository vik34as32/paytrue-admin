import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { AuthUser } from "@/types";

import { logoutUser, loadStoredUser, adminLoginUser } from "@/store/api/authApi";



interface AuthState {

  user: AuthUser | null;

  accessToken: string | null;

  isAuthenticated: boolean;

  isLoading: boolean;

  error: string | null;

}



const initialState: AuthState = {

  user: null,

  accessToken: null,

  isAuthenticated: false,

  isLoading: false,

  error: null,

};



const authSlice = createSlice({

  name: "auth",

  initialState,

  reducers: {

    clearError: (state) => {

      state.error = null;

    },

    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {

      if (state.user) {

        state.user = { ...state.user, ...action.payload };

      }

    },

  },

  extraReducers: (builder) => {

    builder

      .addCase(adminLoginUser.pending, (state) => {

        state.isLoading = true;

        state.error = null;

      })

      .addCase(adminLoginUser.fulfilled, (state, action) => {

        state.isLoading = false;

        state.isAuthenticated = true;

        state.user = action.payload.user;

        state.accessToken = action.payload.accessToken;

      })

      .addCase(adminLoginUser.rejected, (state, action) => {

        state.isLoading = false;

        state.error = action.payload as string;

      })

      .addCase(logoutUser.fulfilled, (state) => {

        state.user = null;

        state.accessToken = null;

        state.isAuthenticated = false;

      })

      .addCase(loadStoredUser.fulfilled, (state, action) => {

        if (action.payload) {

          state.user = action.payload;

          state.isAuthenticated = true;

          state.accessToken =

            localStorage.getItem("adminToken") ||

            sessionStorage.getItem("adminToken") ||

            null;

        }

      });

  },

});



export const { clearError, updateUser } = authSlice.actions;

export default authSlice.reducer;

