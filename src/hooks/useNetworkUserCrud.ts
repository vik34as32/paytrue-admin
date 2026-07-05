"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  deleteUserById,
  getUserById,
  updateUserById,
} from "@/services/userApi";
import { NetworkUserRecord, UserDetailRecord } from "@/types/superAdmin";
import { NetworkUserEditValues } from "@/validations/networkUserSchemas";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function useNetworkUserCrud(onSuccess?: () => void) {
  const [viewUser, setViewUser] = useState<UserDetailRecord | null>(null);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editUserType, setEditUserType] = useState<string>("");
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
      const detail = await getUserById(user.id);
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
      const detail = await getUserById(user.id);
      setEditUserType(detail.userType || detail.role || "");
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
    setEditUserType("");
    setViewUser(null);
  }, []);

  const submitEdit = useCallback(
    async (values: NetworkUserEditValues) => {
      if (!editUserId || !editUserType) return false;
      setIsUpdating(true);
      try {
        await updateUserById(editUserId, values, editUserType);
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
    [editUserId, editUserType, closeEdit, refreshList]
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
      await deleteUserById(deleteTarget.id);
      toast.success("User deleted successfully");
      closeDelete();
      refreshList();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete user"));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, closeDelete, refreshList]);

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
