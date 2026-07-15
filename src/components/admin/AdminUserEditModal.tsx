"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/modals/Modal";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { NetworkUserAvatar } from "@/components/super-admin/NetworkUserAvatar";
import { UserDetailRecord } from "@/types/superAdmin";
import {
  formatUserTypeLabel,
  getNetworkUserName,
} from "@/lib/normalizeUser";
import { AdminUserUpdatePayload } from "@/services/adminUsersApi";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "PENDING", label: "Pending" },
];

const adminUserEditSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().max(100).optional().or(z.literal("")),
  email: z.string().email("Valid email required"),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"]),
});

export type AdminUserEditFormValues = z.infer<typeof adminUserEditSchema>;

interface AdminUserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDetailRecord | null;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onSubmit: (payload: AdminUserUpdatePayload) => Promise<boolean>;
}

export function AdminUserEditModal({
  isOpen,
  onClose,
  user,
  isLoading = false,
  isSubmitting = false,
  onSubmit,
}: AdminUserEditModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminUserEditFormValues>({
    resolver: zodResolver(adminUserEditSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (!isOpen || !user) return;
    const status = String(user.status || "ACTIVE").toUpperCase();
    reset({
      firstName: user.firstName || getNetworkUserName(user).split(" ")[0] || "",
      lastName:
        user.lastName ||
        getNetworkUserName(user).split(" ").slice(1).join(" ") ||
        "",
      email: user.email || "",
      mobile: user.mobile || "",
      status: (["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"].includes(status)
        ? status
        : "ACTIVE") as AdminUserEditFormValues["status"],
    });
  }, [isOpen, user, reset]);

  const submit = handleSubmit(async (values) => {
    const name = [values.firstName, values.lastName]
      .filter((part): part is string => Boolean(part && part.trim()))
      .map((part) => part.trim())
      .join(" ");
    const ok = await onSubmit({
      firstName: values.firstName.trim(),
      lastName: values.lastName?.trim() || null,
      name,
      email: values.email.trim(),
      phone: values.mobile.trim(),
      mobile: values.mobile.trim(),
      status: values.status,
    });
    if (ok) onClose();
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit User"
      subtitle={user ? getNetworkUserName(user) : "Update profile"}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      }
    >
      {isLoading || !user ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <form className="space-y-5" onSubmit={(e) => void submit(e)}>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-card p-4">
            <NetworkUserAvatar user={user} size="lg" />
            <div>
              <p className="text-lg font-semibold text-foreground">
                {getNetworkUserName(user)}
              </p>
              <p className="text-sm text-muted">
                {formatUserTypeLabel(user.userType || user.role)}
                {user.userCode ? ` · ${user.userCode}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted">
                Profile image is shown for reference. Password, role and wallet
                cannot be changed here.
              </p>
            </div>
          </div>

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
              label="Phone / Mobile"
              error={errors.mobile?.message}
              {...register("mobile")}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              error={errors.status?.message}
              {...register("status")}
            />
          </div>
        </form>
      )}
    </Modal>
  );
}
