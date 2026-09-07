"use client";

import { Store } from "lucide-react";
import { Modal } from "@/components/modals/Modal";
import { UserMultiStepForm } from "@/components/forms/UserMultiStepForm";
import { clearUserFormDraft } from "@/lib/userFormDraftStorage";
import { RetailerHierarchyScope } from "@/components/forms/RetailerHierarchyFields";

interface CreateRetailerModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  scope?: RetailerHierarchyScope;
}

export function CreateRetailerModal({
  open,
  onClose,
  onCreated,
  scope = "super_admin",
}: CreateRetailerModalProps) {
  const handleClose = () => {
    clearUserFormDraft("RETAILER");
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title="Create Retailer"
      subtitle="Link under Master Distributor → Distributor, then complete onboarding"
      size="2xl"
      headerVariant="brand"
      headerBadge="Network onboarding"
      headerIcon={<Store className="h-5 w-5" />}
    >
      <div className="max-h-[75vh] overflow-y-auto pr-1">
        <UserMultiStepForm
          userType="RETAILER"
          requireHierarchyLinking
          hierarchyScope={scope}
          requireEmailVerification={false}
          requireMobileVerification={false}
          variant="modal"
          submitLabel="Create Retailer"
          successTitle="Retailer Created!"
          successMessage="The retailer has been onboarded and linked under the selected distributor."
          successToast="Retailer created successfully."
          onCancel={handleClose}
          onCreated={() => {
            onCreated?.();
          }}
        />
      </div>
    </Modal>
  );
}
