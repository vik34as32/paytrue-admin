"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  createBankAccount,
  deleteBankAccountById,
  getBankAccountById,
  updateBankAccountById,
} from "@/services/bankAccountApi";
import { BankAccountRecord } from "@/types/bankAccount";
import { BankAccountFormValues } from "@/validations/bankAccountSchemas";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function toPayload(values: BankAccountFormValues) {
  return {
    accountHolderName: values.accountHolderName.trim(),
    bankName: values.bankName.trim(),
    accountNumber: values.accountNumber.trim(),
    ifscCode: values.ifscCode.trim().toUpperCase(),
    branchName: values.branchName?.trim() || undefined,
    upiId: values.upiId?.trim() || undefined,
    status: values.status,
  };
}

export function useBankAccountCrud(onSuccess?: () => void) {
  const [viewAccount, setViewAccount] = useState<BankAccountRecord | null>(null);
  const [editAccountId, setEditAccountId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BankAccountRecord | null>(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const refreshList = useCallback(() => {
    onSuccess?.();
  }, [onSuccess]);

  const openCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const closeCreate = useCallback(() => {
    setCreateOpen(false);
  }, []);

  const submitCreate = useCallback(
    async (values: BankAccountFormValues) => {
      setIsCreating(true);
      try {
        await createBankAccount(toPayload(values));
        toast.success("Bank account added successfully");
        closeCreate();
        refreshList();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to add bank account"));
        return false;
      } finally {
        setIsCreating(false);
      }
    },
    [closeCreate, refreshList]
  );

  const openView = useCallback(async (account: BankAccountRecord) => {
    setViewOpen(true);
    setIsFetchingDetail(true);
    setViewAccount(null);
    try {
      const detail = await getBankAccountById(account.id);
      setViewAccount(detail);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load bank account details"));
      setViewOpen(false);
    } finally {
      setIsFetchingDetail(false);
    }
  }, []);

  const closeView = useCallback(() => {
    setViewOpen(false);
    setViewAccount(null);
  }, []);

  const openEdit = useCallback(async (account: BankAccountRecord) => {
    setEditOpen(true);
    setEditAccountId(account.id);
    setIsFetchingDetail(true);
    try {
      const detail = await getBankAccountById(account.id);
      setViewAccount(detail);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load bank account for editing"));
      setEditOpen(false);
      setEditAccountId(null);
    } finally {
      setIsFetchingDetail(false);
    }
  }, []);

  const closeEdit = useCallback(() => {
    setEditOpen(false);
    setEditAccountId(null);
    setViewAccount(null);
  }, []);

  const submitEdit = useCallback(
    async (values: BankAccountFormValues) => {
      if (!editAccountId) return false;
      setIsUpdating(true);
      try {
        await updateBankAccountById(editAccountId, toPayload(values));
        toast.success("Bank account updated successfully");
        closeEdit();
        refreshList();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to update bank account"));
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [editAccountId, closeEdit, refreshList]
  );

  const openDelete = useCallback((account: BankAccountRecord) => {
    setDeleteTarget(account);
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
      await deleteBankAccountById(deleteTarget.id);
      toast.success("Bank account deleted successfully");
      closeDelete();
      refreshList();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete bank account"));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, closeDelete, refreshList]);

  return {
    viewOpen,
    createOpen,
    editOpen,
    deleteOpen,
    viewAccount,
    deleteTarget,
    isFetchingDetail,
    isCreating,
    isUpdating,
    isDeleting,
    openCreate,
    closeCreate,
    submitCreate,
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
