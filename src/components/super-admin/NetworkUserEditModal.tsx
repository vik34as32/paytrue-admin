"use client";

import { useEffect, useState } from "react";
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
import { UserDetailRecord } from "@/types/superAdmin";
import {
  formatUserTypeLabel,
  getNetworkUserName,
  getWalletBalance,
} from "@/lib/normalizeUser";
import { mapUserDetailToEditValues, SUPER_ADMIN_BUSINESS_TYPE_OPTIONS } from "@/services/userApi";
import { resolveMediaUrl, formatCurrency, cn } from "@/lib/utils";
import {
  networkUserEditSchema,
  NetworkUserEditValues,
  networkUserEditEmptyDefaults,
} from "@/validations/networkUserSchemas";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "PENDING", label: "Pending" },
];

const EDIT_TABS = [
  { id: "personal", label: "Personal" },
  { id: "outlet", label: "Outlet" },
  { id: "kyc", label: "KYC" },
  { id: "bank", label: "Bank" },
  { id: "status", label: "Status & Photo" },
] as const;

type EditTab = (typeof EDIT_TABS)[number]["id"];

interface NetworkUserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDetailRecord | null;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onSubmit: (values: NetworkUserEditValues) => Promise<boolean>;
}

export function NetworkUserEditModal({
  isOpen,
  onClose,
  user,
  isLoading = false,
  isSubmitting = false,
  onSubmit,
}: NetworkUserEditModalProps) {
  const [activeTab, setActiveTab] = useState<EditTab>("personal");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NetworkUserEditValues>({
    resolver: zodResolver(networkUserEditSchema),
    defaultValues: networkUserEditEmptyDefaults,
  });

  const profileImage = watch("profileImage");

  useEffect(() => {
    if (!user || !isOpen) return;
    reset(mapUserDetailToEditValues(user));
    setActiveTab("personal");
  }, [user, isOpen, reset]);

  const handleFormSubmit = handleSubmit(async (values) => {
    const success = await onSubmit(values);
    if (success) {
      reset(networkUserEditEmptyDefaults);
    }
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit User"
      subtitle={user ? getNetworkUserName(user) : undefined}
      size="2xl"
      footer={
        !isLoading && user ? (
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
      ) : user ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <NetworkUserAvatar user={user} size="lg" />
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-foreground">
                  {getNetworkUserName(user)}
                </h3>
                <p className="text-sm text-muted">
                  {formatUserTypeLabel(user.userType)}
                  {user.userCode ? ` · ${user.userCode}` : ""}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card px-4 py-3 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Wallet Balance
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(getWalletBalance(user))}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-2">
              {EDIT_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}

              <DetailSection title="Read Only" className="mt-4 hidden lg:block">
                <div className="space-y-3">
                  <DetailField label="User ID" value={user.id} mono />
                  <DetailField label="User Code" value={user.userCode} mono />
                  <DetailField label="Parent ID" value={user.parentId} mono />
                  <DetailField
                    label="Email Verified"
                    value={user.isEmailVerified ? "Yes" : "No"}
                  />
                  <DetailField
                    label="Mobile Verified"
                    value={user.mobileVerified ? "Yes" : "No"}
                  />
                </div>
              </DetailSection>
            </div>

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleFormSubmit();
              }}
            >
              {activeTab === "personal" && (
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
                    <Input
                      label="New Password (optional)"
                      type="password"
                      revealable
                      autoComplete="new-password"
                      placeholder="Leave blank to keep current"
                      error={errors.password?.message}
                      {...register("password")}
                    />
                  </div>
                </DetailSection>
              )}

              {activeTab === "outlet" && (
                <DetailSection title="Outlet & Business">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Outlet Name"
                      error={errors.outletName?.message}
                      {...register("outletName")}
                    />
                    <Select
                      label="Business Type"
                      options={SUPER_ADMIN_BUSINESS_TYPE_OPTIONS}
                      error={errors.businessType?.message}
                      {...register("businessType")}
                    />
                    <Input
                      label="GST Number"
                      error={errors.gstNumber?.message}
                      {...register("gstNumber")}
                    />
                    <Input
                      label="State"
                      error={errors.state?.message}
                      {...register("state")}
                    />
                    <Input
                      label="District"
                      error={errors.district?.message}
                      {...register("district")}
                    />
                    <Input
                      label="City"
                      error={errors.city?.message}
                      {...register("city")}
                    />
                    <Input
                      label="Village / Area"
                      error={errors.village?.message}
                      {...register("village")}
                    />
                    <Input
                      label="Pincode"
                      error={errors.pincode?.message}
                      {...register("pincode")}
                    />
                    <Input
                      label="Latitude"
                      error={errors.latitude?.message}
                      {...register("latitude")}
                    />
                    <Input
                      label="Longitude"
                      error={errors.longitude?.message}
                      {...register("longitude")}
                    />
                    <Input
                      label="Address"
                      className="sm:col-span-2"
                      error={errors.address?.message}
                      {...register("address")}
                    />
                  </div>
                </DetailSection>
              )}

              {activeTab === "kyc" && (
                <DetailSection title="KYC Details">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Aadhaar Number"
                      error={errors.aadhaarNumber?.message}
                      {...register("aadhaarNumber")}
                    />
                    <Input
                      label="PAN Number"
                      error={errors.panNumber?.message}
                      {...register("panNumber")}
                    />
                  </div>
                </DetailSection>
              )}

              {activeTab === "bank" && (
                <DetailSection title="Bank Account">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Account Holder Name"
                      error={errors.accountHolderName?.message}
                      {...register("accountHolderName")}
                    />
                    <Input
                      label="Bank Name"
                      error={errors.bankName?.message}
                      {...register("bankName")}
                    />
                    <Input
                      label="Account Number"
                      error={errors.accountNumber?.message}
                      {...register("accountNumber")}
                    />
                    <Input
                      label="IFSC Code"
                      error={errors.ifscCode?.message}
                      {...register("ifscCode")}
                    />
                  </div>
                </DetailSection>
              )}

              {activeTab === "status" && (
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
                        setValue(
                          "status",
                          event.target.value as NetworkUserEditValues["status"]
                        )
                      }
                    />
                    <div className="sm:col-span-2">
                      <ImageUpload
                        label="Profile Image"
                        file={profileImage}
                        existingUrl={
                          resolveMediaUrl(user.profileImage) || undefined
                        }
                        onChange={(file) => setValue("profileImage", file)}
                        error={
                          errors.profileImage?.message as string | undefined
                        }
                      />
                    </div>
                  </div>
                </DetailSection>
              )}
            </form>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">No user data available.</p>
      )}
    </Modal>
  );
}
