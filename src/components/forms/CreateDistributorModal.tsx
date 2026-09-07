"use client";

import { Network } from "lucide-react";
import { Modal } from "@/components/modals/Modal";
import { UserMultiStepForm } from "@/components/forms/UserMultiStepForm";
import { clearUserFormDraft } from "@/lib/userFormDraftStorage";
import { RetailerHierarchyScope } from "@/components/forms/RetailerHierarchyFields";

interface CreateDistributorModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  scope?: RetailerHierarchyScope;
}

export function CreateDistributorModal({
  open,
  onClose,
  onCreated,
  scope = "super_admin",
}: CreateDistributorModalProps) {
  const handleClose = () => {
    clearUserFormDraft("DISTRIBUTOR");
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title="Create Distributor"
      subtitle="Link under a Master Distributor, then complete onboarding"
      size="2xl"
      headerVariant="brand"
      headerBadge="Network onboarding"
      headerIcon={<Network className="h-5 w-5" />}
    >
      <div className="max-h-[75vh] overflow-y-auto pr-1">
        <UserMultiStepForm
          userType="DISTRIBUTOR"
          requireHierarchyLinking
          hierarchyScope={scope}
          requireEmailVerification={false}
          requireMobileVerification={false}
          variant="modal"
          submitLabel="Create Distributor"
          successTitle="Distributor Created!"
          successMessage="The distributor has been onboarded and linked under the selected master distributor."
          successToast="Distributor created successfully."
          onCancel={handleClose}
          onCreated={() => {
            onCreated?.();
          }}
        />
      </div>
    </Modal>
  );
}
