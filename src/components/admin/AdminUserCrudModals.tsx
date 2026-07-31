"use client";

import { useMemo } from "react";
import { AdminUserStepModal } from "@/components/admin/AdminUserStepModal";
import { NetworkUserDetailsView } from "@/components/super-admin/NetworkUserDetailsView";
import { DeleteNetworkUserDialog } from "@/components/super-admin/DeleteNetworkUserDialog";
import { useAdminUserCrud } from "@/hooks/useAdminUserCrud";
import { createAdminNetworkUserColumns } from "@/lib/networkUserColumns";
import { AdminManagedUserRole } from "@/services/adminUsersApi";
import { NetworkUserRecord } from "@/types/superAdmin";

interface AdminUserCrudModalsProps {
  crud: ReturnType<typeof useAdminUserCrud>;
}

export function AdminUserCrudModals({ crud }: AdminUserCrudModalsProps) {
  return (
    <>
      <NetworkUserDetailsView
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
  onRefresh: () => void,
  options?: {
    pageIndex?: number;
    pageSize?: number;
    enableVerification?: boolean;
    /** Edit/Delete only for Super Admin — Admin panel must keep this false */
    showEditDelete?: boolean;
    verification?: {
      onVerify: (user: NetworkUserRecord) => void;
      onReject: (user: NetworkUserRecord) => void;
      onViewVerification: (user: NetworkUserRecord) => void;
      onViewRejectReason: (user: NetworkUserRecord) => void;
      onTransfer?: (user: NetworkUserRecord) => void;
      onDeduct?: (user: NetworkUserRecord) => void;
      disabled?: boolean;
    };
  }
) {
  const crud = useAdminUserCrud(role, onRefresh);
  const pageIndex = options?.pageIndex ?? 0;
  const pageSize = options?.pageSize ?? 10;
  const showEditDelete = options?.showEditDelete === true;

  const columns = useMemo(
    () =>
      createAdminNetworkUserColumns(
        {
          onView: (user) => void crud.openView(user),
          onEdit: (user) => void crud.openEdit(user),
          onDelete: crud.openDelete,
          showEditDelete,
          showVerificationActions: options?.enableVerification,
          onVerify: options?.verification?.onVerify,
          onReject: options?.verification?.onReject,
          onViewVerification: options?.verification?.onViewVerification,
          onViewRejectReason: options?.verification?.onViewRejectReason,
          onTransfer: options?.verification?.onTransfer,
          onDeduct: options?.verification?.onDeduct,
          disabled:
            crud.isFetchingDetail ||
            crud.isUpdating ||
            crud.isDeleting ||
            options?.verification?.disabled,
        },
        { userKind: role, pageIndex, pageSize }
      ),
    [
      role,
      pageIndex,
      pageSize,
      showEditDelete,
      crud.openView,
      crud.openEdit,
      crud.openDelete,
      crud.isFetchingDetail,
      crud.isUpdating,
      crud.isDeleting,
      options?.enableVerification,
      options?.verification,
    ]
  );

  return { columns, crud };
}
