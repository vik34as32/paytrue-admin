"use client";

import { useMemo } from "react";
import { SuperAdminUserStepModal } from "@/components/super-admin/SuperAdminUserStepModal";
import { NetworkUserDetailsView } from "@/components/super-admin/NetworkUserDetailsView";
import { DeleteNetworkUserDialog } from "@/components/super-admin/DeleteNetworkUserDialog";
import { useNetworkUserCrud } from "@/hooks/useNetworkUserCrud";
import { createSuperAdminNetworkUserColumns } from "@/lib/networkUserColumns";
import type { NetworkUserListKind } from "@/lib/networkUserColumns";
import { NetworkUserRecord } from "@/types/superAdmin";

interface NetworkUserCrudModalsProps {
  crud: ReturnType<typeof useNetworkUserCrud>;
}

export function NetworkUserCrudModals({ crud }: NetworkUserCrudModalsProps) {
  return (
    <>
      <NetworkUserDetailsView
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
  options?: {
    pageIndex?: number;
    pageSize?: number;
    userKind?: NetworkUserListKind;
    enableVerification?: boolean;
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
        {
          pageIndex: options?.pageIndex,
          pageSize: options?.pageSize,
          userKind: options?.userKind,
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
      options?.userKind,
      options?.enableVerification,
      options?.verification,
    ]
  );

  return { columns, crud };
}
