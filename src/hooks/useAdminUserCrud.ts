"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  deleteAdminUser,
  getAdminUserById,
  patchAdminUser,
  AdminManagedUserRole,
  AdminUserUpdatePayload,
} from "@/services/adminUsersApi";
import { clearUserFormDraft } from "@/lib/userFormDraftStorage";
import { NetworkUserRecord, UserDetailRecord } from "@/types/superAdmin";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function useAdminUserCrud(
  role: AdminManagedUserRole,
  onSuccess?: () => void
) {
  const [viewUser, setViewUser] = useState<UserDetailRecord | null>(null);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NetworkUserRecord | null>(
    null
  );
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const refreshList = useCallback(() => {
    onSuccess?.();
  }, [onSuccess]);

  const openView = useCallback(async (user: NetworkUserRecord) => {
    setViewOpen(true);
    setIsFetchingDetail(true);
    setViewUser(null);
    try {
      const detail = await getAdminUserById(user.id);
      setViewUser(detail);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load user details"));
      setViewOpen(false);
    } finally {
      setIsFetchingDetail(false);
    }
  }, []);

  const closeView = useCallback(() => {
    setViewOpen(false);
    setViewUser(null);
  }, []);

  const openEdit = useCallback(async (user: NetworkUserRecord) => {
    setEditOpen(true);
    setEditUserId(user.id);
    setIsFetchingDetail(true);
    try {
      const detail = await getAdminUserById(user.id);
      setViewUser(detail);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load user for editing"));
      setEditOpen(false);
      setEditUserId(null);
    } finally {
      setIsFetchingDetail(false);
    }
  }, []);

  const closeEdit = useCallback(() => {
    setEditOpen(false);
    setEditUserId(null);
    setViewUser(null);
  }, []);

  const submitEdit = useCallback(
    async (payload: AdminUserUpdatePayload) => {
      if (!editUserId) return false;
      setIsUpdating(true);
      try {
        await patchAdminUser(editUserId, payload);
        toast.success("User updated successfully");
        closeEdit();
        refreshList();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to update user"));
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [editUserId, closeEdit, refreshList]
  );

  const openDelete = useCallback((user: NetworkUserRecord) => {
    setDeleteTarget(user);
    setDeleteOpen(true);
  }, []);

  const closeDelete = useCallback(() => {
    setDeleteOpen(false);
    setDeleteTarget(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAdminUser(deleteTarget.id);
      // Clear any create-form draft images/data kept in localStorage for this role
      clearUserFormDraft(role);
      toast.success("User deleted successfully");
      closeDelete();
      refreshList();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete user"));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, role, closeDelete, refreshList]);

  return {
    viewOpen,
    editOpen,
    deleteOpen,
    viewUser,
    editUserId,
    deleteTarget,
    isFetchingDetail,
    isUpdating,
    isDeleting,
    openView,
    closeView,
    openEdit,
    closeEdit,
    submitEdit,
    openDelete,
    closeDelete,
    confirmDelete,
  };
}
