"use client";

import { useMemo } from "react";
import { CreateBankAccountModal } from "@/components/super-admin/CreateBankAccountModal";
import { BankAccountViewModal } from "@/components/super-admin/BankAccountViewModal";
import { BankAccountEditModal } from "@/components/super-admin/BankAccountEditModal";
import { DeleteBankAccountDialog } from "@/components/super-admin/DeleteBankAccountDialog";
import { useBankAccountCrud } from "@/hooks/useBankAccountCrud";
import { createBankAccountColumns } from "@/lib/bankAccountColumns";

interface BankAccountCrudModalsProps {
  crud: ReturnType<typeof useBankAccountCrud>;
}

export function BankAccountCrudModals({ crud }: BankAccountCrudModalsProps) {
  return (
    <>
      <CreateBankAccountModal
        isOpen={crud.createOpen}
        onClose={crud.closeCreate}
        isSubmitting={crud.isCreating}
        onSubmit={crud.submitCreate}
      />
      <BankAccountViewModal
        isOpen={crud.viewOpen}
        onClose={crud.closeView}
        account={crud.viewAccount}
        isLoading={crud.isFetchingDetail && crud.viewOpen}
      />
      <BankAccountEditModal
        isOpen={crud.editOpen}
        onClose={crud.closeEdit}
        account={crud.viewAccount}
        isLoading={crud.isFetchingDetail && crud.editOpen}
        isSubmitting={crud.isUpdating}
        onSubmit={crud.submitEdit}
      />
      <DeleteBankAccountDialog
        isOpen={crud.deleteOpen}
        onClose={crud.closeDelete}
        account={crud.deleteTarget}
        isDeleting={crud.isDeleting}
        onConfirm={() => void crud.confirmDelete()}
      />
    </>
  );
}

export function useBankAccountTableColumns(onRefresh: () => void) {
  const crud = useBankAccountCrud(onRefresh);

  const columns = useMemo(
    () =>
      createBankAccountColumns({
        onView: (account) => void crud.openView(account),
        onEdit: (account) => void crud.openEdit(account),
        onDelete: crud.openDelete,
        disabled:
          crud.isFetchingDetail ||
          crud.isCreating ||
          crud.isUpdating ||
          crud.isDeleting,
      }),
    [
      crud.openView,
      crud.openEdit,
      crud.openDelete,
      crud.isFetchingDetail,
      crud.isCreating,
      crud.isUpdating,
      crud.isDeleting,
    ]
  );

  return { columns, crud };
}
