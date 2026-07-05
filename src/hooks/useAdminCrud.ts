"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  deleteUserById,
  getAdminById,
  updateAdminById,
} from "@/services/userApi";
import { AdminDetailRecord, AdminRecord } from "@/types/superAdmin";
import { AdminEditValues } from "@/validations/adminSchemas";
import { getAdminDisplayName } from "@/services/admin";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function useAdminCrud(onSuccess?: () => void) {
  const [viewAdmin, setViewAdmin] = useState<AdminDetailRecord | null>(null);
  const [editAdminId, setEditAdminId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRecord | null>(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const refreshList = useCallback(() => {
    onSuccess?.();
  }, [onSuccess]);

  const openView = useCallback(async (admin: AdminRecord) => {
    setViewOpen(true);
    setIsFetchingDetail(true);
    setViewAdmin(null);
    try {
      const detail = await getAdminById(admin.id);
      setViewAdmin(detail);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load admin details"));
      setViewOpen(false);
    } finally {
      setIsFetchingDetail(false);
    }
  }, []);

  const closeView = useCallback(() => {
    setViewOpen(false);
    setViewAdmin(null);
  }, []);

  const openEdit = useCallback(async (admin: AdminRecord) => {
    setEditOpen(true);
    setEditAdminId(admin.id);
    setIsFetchingDetail(true);
    try {
      const detail = await getAdminById(admin.id);
      setViewAdmin(detail);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load admin for editing"));
      setEditOpen(false);
      setEditAdminId(null);
    } finally {
      setIsFetchingDetail(false);
    }
  }, []);

  const closeEdit = useCallback(() => {
    setEditOpen(false);
    setEditAdminId(null);
    setViewAdmin(null);
  }, []);

  const submitEdit = useCallback(
    async (values: AdminEditValues) => {
      if (!editAdminId) return false;
      setIsUpdating(true);
      try {
        await updateAdminById(editAdminId, values);
        toast.success("Admin updated successfully");
        closeEdit();
        refreshList();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to update admin"));
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [editAdminId, closeEdit, refreshList]
  );

  const openDelete = useCallback((admin: AdminRecord) => {
    setDeleteTarget(admin);
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
      toast.success("Admin deleted successfully");
      closeDelete();
      refreshList();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete admin"));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, closeDelete, refreshList]);

  return {
    viewOpen,
    editOpen,
    deleteOpen,
    viewAdmin,
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
    getDeleteLabel: (admin: AdminRecord | null) =>
      admin ? getAdminDisplayName(admin) : "this admin",
  };
}
