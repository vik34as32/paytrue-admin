"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import {
  fetchUsers,
  createUser,
  updateUserById,
  deleteUserById,
} from "@/store/slices/userSlice";
import { useRoleAccess } from "@/hooks/useAuth";
import { DataTable } from "@/components/tables/DataTable";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Modal } from "@/components/modals/Modal";
import { CreateUserForm } from "@/components/forms/CreateUserForm";
import { CreateUserFormData, UpdateUserFormData } from "@/validations";
import { User } from "@/types";
import { ROLES } from "@/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { mockApi } from "@/services/mockApi";
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from "react-icons/hi";

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { users, isLoading } = useAppSelector((state) => state.users);
  const { user: currentUser, canCreateUsers, canManageUsers } = useRoleAccess();
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [parentOptions, setParentOptions] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    dispatch(fetchUsers({ page: 1, pageSize: 50 }));
    mockApi.getAllUsersFlat().then((all) => {
      setParentOptions(
        all.map((u) => ({ value: u.id, label: `${u.name} (${ROLES[u.role]})` }))
      );
    });
  }, [dispatch]);

  const handleCreate = async (data: CreateUserFormData) => {
    if (!currentUser) return;
    const result = await dispatch(
      createUser({ data, createdBy: currentUser.id })
    );
    if (createUser.fulfilled.match(result)) {
      toast.success("User created successfully");
      setShowCreate(false);
      dispatch(fetchUsers({ page: 1, pageSize: 50 }));
    } else {
      toast.error("Failed to create user");
    }
  };

  const handleSuspend = async (user: User) => {
    if (!currentUser) return;
    const newStatus = user.status === "suspended" ? "active" : "suspended";
    await dispatch(
      updateUserById({
        id: user.id,
        data: { ...user, status: newStatus } as UpdateUserFormData,
        updatedBy: currentUser.id,
      })
    );
    toast.success(`User ${newStatus === "suspended" ? "suspended" : "activated"}`);
    dispatch(fetchUsers({ page: 1, pageSize: 50 }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    await dispatch(deleteUserById(id));
    toast.success("User deleted");
    dispatch(fetchUsers({ page: 1, pageSize: 50 }));
  };

  const columns: ColumnDef<User, unknown>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "mobile", header: "Mobile" },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => ROLES[row.original.role],
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => formatCurrency(row.original.balance),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status as "active" | "suspended" | "inactive"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDate(row.original.createdAt, "dd MMM yyyy"),
    },
    ...(canManageUsers
      ? [
          {
            id: "actions",
            header: "Actions",
            cell: ({ row }: { row: { original: User } }) => (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditUser(row.original)}
                >
                  <HiOutlinePencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSuspend(row.original)}
                >
                  {row.original.status === "suspended" ? "Activate" : "Suspend"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(row.original.id)}
                >
                  <HiOutlineTrash className="h-4 w-4 text-accent-red" />
                </Button>
              </div>
            ),
          } as ColumnDef<User, unknown>,
        ]
      : []),
  ];

  if (!canManageUsers) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted">You don&apos;t have permission to manage users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
  <div>
    <h1 className="text-3xl font-bold text-foreground">
      User Management
    </h1>

    <p className="mt-1 text-sm text-muted">
      Create and manage system users
    </p>
  </div>

  {canCreateUsers && (
    <div className="mt-4 flex justify-end">
      <Button
        onClick={() => setShowCreate(true)}
        className="px-5 py-2 shadow-md"
      >
        <HiOutlinePlus className="h-4 w-4" />
        Create User
      </Button>
    </div>
  )}
</div>

      <Card>
        <DataTable
          data={users?.data || []}
          columns={columns}
          isLoading={isLoading}
          searchPlaceholder="Search users..."
        />
      </Card>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create New User"
        size="lg"
      >
        <CreateUserForm
          onSubmit={handleCreate}
          parentOptions={parentOptions}
          creatorRole={currentUser?.role || "super_admin"}
        />
      </Modal>

      {editUser && (
        <Modal
          isOpen={!!editUser}
          onClose={() => setEditUser(null)}
          title="Edit User"
        >
          <p className="text-sm text-muted mb-4">
            Editing: <strong>{editUser.name}</strong>
          </p>
          <Button
            onClick={async () => {
              if (!currentUser) return;
              await dispatch(
                updateUserById({
                  id: editUser.id,
                  data: {
                    name: editUser.name,
                    email: editUser.email,
                    mobile: editUser.mobile,
                    role: editUser.role,
                    status: editUser.status,
                  },
                  updatedBy: currentUser.id,
                })
              );
              toast.success("User updated");
              setEditUser(null);
              dispatch(fetchUsers({ page: 1, pageSize: 50 }));
            }}
          >
            Save Changes
          </Button>
        </Modal>
      )}
    </div>
  );
}
