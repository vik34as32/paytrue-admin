import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllAdmins } from "@/services/admin";
import { User, PaginatedResponse } from "@/types";
import { getAdminDisplayName } from "@/services/admin";
import { AdminRecord } from "@/types/superAdmin";

function adminToUser(admin: AdminRecord): User {
  const now = new Date().toISOString();
  return {
    id: admin.adminId || admin.id,
    name: getAdminDisplayName(admin),
    email: admin.email,
    mobile: admin.mobile,
    password: "",
    role: "admin",
    status: "active",
    balance: admin.currentWalletBalance ?? admin.walletBalance ?? admin.balance ?? 0,
    parentId: null,
    createdBy: null,
    createdAt: now,
    updatedAt: now,
  };
}

export const fetchUsers = createAsyncThunk(
  "users/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const admins = await getAllAdmins();
      const data = admins.map(adminToUser);
      return {
        data,
        total: data.length,
        page: 1,
        pageSize: data.length,
        totalPages: 1,
      } satisfies PaginatedResponse<User>;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch users"
      );
    }
  }
);

export const createUser = createAsyncThunk(
  "users/create",
  async (_payload: unknown, { rejectWithValue }) =>
    rejectWithValue("Use Admin Management to create admins via live API")
);

export const updateUserById = createAsyncThunk(
  "users/update",
  async (_payload: unknown, { rejectWithValue }) =>
    rejectWithValue("User update API not available")
);

export const deleteUserById = createAsyncThunk(
  "users/delete",
  async (_id: string, { rejectWithValue }) =>
    rejectWithValue("User delete API not available")
);

interface UserState {
  users: PaginatedResponse<User> | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: null,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default userSlice.reducer;
