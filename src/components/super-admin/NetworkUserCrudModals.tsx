"use client";

import { useMemo } from "react";
import { NetworkUserViewModal } from "@/components/super-admin/NetworkUserViewModal";
import { NetworkUserEditModal } from "@/components/super-admin/NetworkUserEditModal";
import { DeleteNetworkUserDialog } from "@/components/super-admin/DeleteNetworkUserDialog";
import { useNetworkUserCrud } from "@/hooks/useNetworkUserCrud";
import { createNetworkUserColumns } from "@/lib/networkUserColumns";

interface NetworkUserCrudModalsProps {
  crud: ReturnType<typeof useNetworkUserCrud>;
}

export function NetworkUserCrudModals({ crud }: NetworkUserCrudModalsProps) {
  return (
    <>
      <NetworkUserViewModal
        isOpen={crud.viewOpen}
        onClose={crud.closeView}
        user={crud.viewUser}
        isLoading={crud.isFetchingDetail && crud.viewOpen}
      />
      <NetworkUserEditModal
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
  onRefresh: () => void
) {
  const crud = useNetworkUserCrud(onRefresh);

  const columns = useMemo(
    () =>
      createNetworkUserColumns({
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
