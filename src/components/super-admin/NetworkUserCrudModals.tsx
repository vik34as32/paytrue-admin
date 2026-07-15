"use client";

import { useMemo } from "react";
import { SuperAdminUserStepModal } from "@/components/super-admin/SuperAdminUserStepModal";
import { DeleteNetworkUserDialog } from "@/components/super-admin/DeleteNetworkUserDialog";
import { useNetworkUserCrud } from "@/hooks/useNetworkUserCrud";
import { createSuperAdminNetworkUserColumns } from "@/lib/networkUserColumns";

interface NetworkUserCrudModalsProps {
  crud: ReturnType<typeof useNetworkUserCrud>;
}

export function NetworkUserCrudModals({ crud }: NetworkUserCrudModalsProps) {
  return (
    <>
      <SuperAdminUserStepModal
        mode="view"
        isOpen={crud.viewOpen}
        onClose={crud.closeView}
        user={crud.viewUser}
        isLoading={crud.isFetchingDetail && crud.viewOpen}
      />
      <SuperAdminUserStepModal
        mode="edit"
        isOpen={crud.editOpen}
        onClose={crud.closeEdit}
        user={crud.viewUser}
        isLoading={crud.isFetchingDetail && crud.editOpen}
        isSubmitting={crud.isUpdating}
        onSubmit={crud.submitEdit}
      />
      <DeleteNetworkUserDialog
        isOpen={crud.deleteOpen}
        onClose={crud.closeDelete}
        user={crud.deleteTarget}
        isDeleting={crud.isDeleting}
        onConfirm={() => void crud.confirmDelete()}
      />
    </>
  );
}

export function useNetworkUserTableColumns(
  onRefresh: () => void,
  options?: { pageIndex?: number; pageSize?: number }
) {
  const crud = useNetworkUserCrud(onRefresh);

  const columns = useMemo(
    () =>
      createSuperAdminNetworkUserColumns(
        {
          onView: (user) => void crud.openView(user),
          onEdit: (user) => void crud.openEdit(user),
          onDelete: crud.openDelete,
          onActivate: crud.activateUser,
          onDeactivate: crud.deactivateUser,
          onResetPassword: (user) => void crud.resetPassword(user),
          disabled:
            crud.isFetchingDetail || crud.isUpdating || crud.isDeleting,
        },
        {
          pageIndex: options?.pageIndex,
          pageSize: options?.pageSize,
        }
      ),
    [
      crud.openView,
      crud.openEdit,
      crud.openDelete,
      crud.activateUser,
      crud.deactivateUser,
      crud.resetPassword,
      crud.isFetchingDetail,
      crud.isUpdating,
      crud.isDeleting,
      options?.pageIndex,
      options?.pageSize,
    ]
  );

  return { columns, crud };
}
