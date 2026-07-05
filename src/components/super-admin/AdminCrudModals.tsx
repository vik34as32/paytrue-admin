"use client";

import { useMemo } from "react";
import { AdminViewModal } from "@/components/super-admin/AdminViewModal";
import { AdminEditModal } from "@/components/super-admin/AdminEditModal";
import { DeleteAdminDialog } from "@/components/super-admin/DeleteAdminDialog";
import { useAdminCrud } from "@/hooks/useAdminCrud";
import { createAdminColumns } from "@/lib/adminColumns";

interface AdminCrudModalsProps {
  crud: ReturnType<typeof useAdminCrud>;
}

export function AdminCrudModals({ crud }: AdminCrudModalsProps) {
  return (
    <>
      <AdminViewModal
        isOpen={crud.viewOpen}
        onClose={crud.closeView}
        admin={crud.viewAdmin}
        isLoading={crud.isFetchingDetail && crud.viewOpen}
      />
      <AdminEditModal
        isOpen={crud.editOpen}
        onClose={crud.closeEdit}
        admin={crud.viewAdmin}
        isLoading={crud.isFetchingDetail && crud.editOpen}
        isSubmitting={crud.isUpdating}
        onSubmit={crud.submitEdit}
      />
      <DeleteAdminDialog
        isOpen={crud.deleteOpen}
        onClose={crud.closeDelete}
        admin={crud.deleteTarget}
        isDeleting={crud.isDeleting}
        onConfirm={() => void crud.confirmDelete()}
      />
    </>
  );
}

export function useAdminTableColumns(onRefresh: () => void) {
  const crud = useAdminCrud(onRefresh);

  const columns = useMemo(
    () =>
      createAdminColumns({
        onView: (admin) => void crud.openView(admin),
        onEdit: (admin) => void crud.openEdit(admin),
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
