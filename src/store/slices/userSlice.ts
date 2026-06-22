import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { mockApi } from "@/services/mockApi";
import { User, TableFilters, PaginatedResponse } from "@/types";
import { CreateUserFormData, UpdateUserFormData } from "@/validations";

export const fetchUsers = createAsyncThunk(
  "users/fetchAll",
  async (filters?: TableFilters) => mockApi.getUsers(filters)
);

export const createUser = createAsyncThunk(
  "users/create",
  async ({
    data,
    createdBy,
  }: {
    data: CreateUserFormData;
    createdBy: string;
  }) => {
    const { confirmPassword: _, ...userData } = data;
    return mockApi.createUser(
      {
        ...userData,
        status: "active",
        balance: userData.balance || 0,
        parentId: userData.parentId || null,
        createdBy,
        password: userData.password,
      },
      createdBy
    );
  }
);

export const updateUserById = createAsyncThunk(
  "users/update",
  async ({
    id,
    data,
    updatedBy,
  }: {
    id: string;
    data: UpdateUserFormData;
    updatedBy: string;
  }) => mockApi.updateUser(id, data, updatedBy)
);

export const deleteUserById = createAsyncThunk(
  "users/delete",
  async (id: string) => {
    await mockApi.deleteUser(id);
    return id;
  }
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
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload as PaginatedResponse<User>;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch users";
      })
      .addCase(createUser.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(deleteUserById.fulfilled, (state, action) => {
        if (state.users) {
          state.users.data = state.users.data.filter(
            (u) => u.id !== action.payload
          );
          state.users.total -= 1;
        }
      });
  },
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;
