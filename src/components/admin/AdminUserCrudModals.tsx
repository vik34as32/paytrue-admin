"use client";

import { useMemo } from "react";
import { AdminUserStepModal } from "@/components/admin/AdminUserStepModal";
import { DeleteNetworkUserDialog } from "@/components/super-admin/DeleteNetworkUserDialog";
import { useAdminUserCrud } from "@/hooks/useAdminUserCrud";
import { createAdminNetworkUserColumns } from "@/lib/networkUserColumns";
import { AdminManagedUserRole } from "@/services/adminUsersApi";

interface AdminUserCrudModalsProps {
  crud: ReturnType<typeof useAdminUserCrud>;
}

export function AdminUserCrudModals({ crud }: AdminUserCrudModalsProps) {
  return (
    <>
      <AdminUserStepModal
        mode="view"
        isOpen={crud.viewOpen}
        onClose={crud.closeView}
        user={crud.viewUser}
        isLoading={crud.isFetchingDetail && crud.viewOpen}
      />
      <AdminUserStepModal
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
        confirmQuestion="Do you want to delete this user?"
        onConfirm={() => void crud.confirmDelete()}
      />
    </>
  );
}

export function useAdminUserTableColumns(
  role: AdminManagedUserRole,
  onRefresh: () => void
) {
  const crud = useAdminUserCrud(role, onRefresh);

  const columns = useMemo(
    () =>
      createAdminNetworkUserColumns({
        onView: (user) => void crud.openView(user),
        onEdit: (user) => void crud.openEdit(user),
        onDelete: crud.openDelete,
        disabled:
          crud.isFetchingDetail || crud.isUpdating || crud.isDeleting,
      }),
    [
      crud.openView,
      crud.openEdit,
      crud.openDelete,
      crud.isFetchingDetail,
      crud.isUpdating,
      crud.isDeleting,
    ]
  );

  return { columns, crud };
}
