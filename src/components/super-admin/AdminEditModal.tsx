"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/modals/Modal";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { ImageUpload } from "@/components/common/ImageUpload";
import { NetworkUserAvatar } from "@/components/super-admin/NetworkUserAvatar";
import {
  DetailField,
  DetailSection,
} from "@/components/super-admin/NetworkUserDetailSections";
import {
  getAdminBalance,
  getAdminDisplayName,
  getAdminId,
} from "@/components/super-admin/AdminDetailSections";
import { formatAdminUserType } from "@/lib/normalizeAdmin";
import { AdminDetailRecord } from "@/types/superAdmin";
import { resolveMediaUrl, formatCurrency } from "@/lib/utils";
import {
  adminEditSchema,
  AdminEditValues,
  adminEditEmptyDefaults,
  mapAdminDetailToEditValues,
} from "@/validations/adminSchemas";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "PENDING", label: "Pending" },
];

interface AdminEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: AdminDetailRecord | null;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onSubmit: (values: AdminEditValues) => Promise<boolean>;
}

export function AdminEditModal({
  isOpen,
  onClose,
  admin,
  isLoading = false,
  isSubmitting = false,
  onSubmit,
}: AdminEditModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdminEditValues>({
    resolver: zodResolver(adminEditSchema),
    defaultValues: adminEditEmptyDefaults,
  });

  const profileImage = watch("profileImage");

  useEffect(() => {
    if (!admin || !isOpen) return;
    reset(mapAdminDetailToEditValues(admin));
  }, [admin, isOpen, reset]);

  const handleFormSubmit = handleSubmit(async (values) => {
    const success = await onSubmit(values);
    if (success) {
      reset(adminEditEmptyDefaults);
    }
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Admin"
      subtitle={admin ? getAdminDisplayName(admin) : undefined}
      size="2xl"
      footer={
        !isLoading && admin ? (
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleFormSubmit()}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Save Changes
            </Button>
          </div>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : admin ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <NetworkUserAvatar user={admin} size="lg" />
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-foreground">
                  {getAdminDisplayName(admin)}
                </h3>
                <p className="text-sm text-muted">
                  {formatAdminUserType(admin.userType)}
                  {admin.userCode ? ` · ${admin.userCode}` : ""}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card px-4 py-3 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Wallet Balance
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(getAdminBalance(admin))}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleFormSubmit();
              }}
            >
              <DetailSection title="Personal Information">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="First Name"
                    error={errors.firstName?.message}
                    {...register("firstName")}
                  />
                  <Input
                    label="Last Name"
                    error={errors.lastName?.message}
                    {...register("lastName")}
                  />
                  <Input
                    label="Email"
                    type="email"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                  <Input
                    label="Mobile Number"
                    error={errors.mobile?.message}
                    {...register("mobile")}
                  />
                  <Input
                    label="Alternate Mobile"
                    error={errors.alternateMobileNumber?.message}
                    {...register("alternateMobileNumber")}
                  />
                </div>
              </DetailSection>

              <DetailSection title="Status & Profile">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Status"
                    options={[
                      { value: "", label: "Select status" },
                      ...STATUS_OPTIONS,
                    ]}
                    value={watch("status") || ""}
                    onChange={(event) =>
                      setValue("status", event.target.value)
                    }
                  />
                  <div className="sm:col-span-2">
                    <ImageUpload
                      label="Profile Image"
                      file={profileImage}
                      existingUrl={
                        resolveMediaUrl(admin.profileImage) || undefined
                      }
                      onChange={(file) => setValue("profileImage", file)}
                      error={
                        errors.profileImage?.message as string | undefined
                      }
                    />
                  </div>
                </div>
              </DetailSection>
            </form>

            <div className="space-y-4">
              <DetailSection title="Read Only">
                <div className="space-y-3">
                  <DetailField label="Admin ID" value={getAdminId(admin)} mono />
                  <DetailField label="User Code" value={admin.userCode} mono />
                  <DetailField label="User ID" value={admin.id} mono />
                  <DetailField
                    label="User Type"
                    value={formatAdminUserType(admin.userType)}
                  />
                  <DetailField
                    label="Email Verified"
                    value={admin.isEmailVerified ? "Yes" : "No"}
                  />
                  <DetailField
                    label="Mobile Verified"
                    value={admin.mobileVerified ? "Yes" : "No"}
                  />
                  <DetailField
                    label="Wallet Status"
                    value={admin.wallet?.status}
                  />
                </div>
              </DetailSection>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">No admin data available.</p>
      )}
    </Modal>
  );
}
