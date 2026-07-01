"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import {
  superAdminProfileSchema,
  SuperAdminProfileFormData,
} from "@/validations";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import {
  fetchAdminProfile,
  fetchAdminWalletBalance,
  updateAdminProfile,
} from "@/store/api/adminModuleApi";
import {
  selectAdminProfile,
  selectAdminBalance,
  resolveAdminPrimaryBalance,
} from "@/store/selectors/adminSelectors";
import { formatCurrency, getInitials } from "@/lib/utils";
import { ROLES } from "@/constants";

export function AdminProfileView() {
  const dispatch = useAppDispatch();
  const adminProfile = useAppSelector(selectAdminProfile);
  const adminBalance = useAppSelector(selectAdminBalance);
  const {
    isLoadingProfile,
    profileUpdateLoading,
    isLoadingBalance,
    error,
  } = useAppSelector((state) => state.adminModule);

  const profileForm = useForm<SuperAdminProfileFormData>({
    resolver: zodResolver(superAdminProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
    },
  });

  useEffect(() => {
    dispatch(fetchAdminProfile());
    dispatch(fetchAdminWalletBalance({ force: true }));
  }, [dispatch]);

  useEffect(() => {
    if (adminProfile) {
      profileForm.reset({
        firstName: adminProfile.firstName || "",
        lastName: adminProfile.lastName || "",
        email: adminProfile.email || "",
        mobile: adminProfile.mobile || "",
      });
    }
  }, [adminProfile, profileForm]);

  const displayName =
    adminProfile?.name ||
    [adminProfile?.firstName, adminProfile?.lastName].filter(Boolean).join(" ") ||
    adminProfile?.email ||
    "Admin";

  const handleProfileUpdate = async (data: SuperAdminProfileFormData) => {
    const result = await dispatch(
      updateAdminProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        mobile: data.mobile,
      })
    );
    if (updateAdminProfile.fulfilled.match(result)) {
      toast.success("Profile updated");
    } else {
      toast.error((result.payload as string) || "Failed to update profile");
    }
  };

  return (
    <div className="page-container space-y-6">
      <PageHeader
        breadcrumb="Admin"
        title="Profile"
        subtitle="View and update your admin account"
      />

      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-2xl font-bold text-white">
              {getInitials(displayName)}
            </div>
            <h2 className="text-lg font-bold">{displayName}</h2>
            <p className="text-sm text-muted">{ROLES.admin}</p>
            <p className="mt-2 text-lg font-semibold text-primary">
              {isLoadingBalance
                ? "..."
                : formatCurrency(resolveAdminPrimaryBalance(adminBalance))}
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Update Profile" />
          <form
            onSubmit={profileForm.handleSubmit(handleProfileUpdate)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <Input
              label="First Name"
              error={profileForm.formState.errors.firstName?.message}
              {...profileForm.register("firstName")}
            />
            <Input
              label="Last Name"
              error={profileForm.formState.errors.lastName?.message}
              {...profileForm.register("lastName")}
            />
            <Input
              label="Email"
              type="email"
              error={profileForm.formState.errors.email?.message}
              {...profileForm.register("email")}
            />
            <Input
              label="Mobile"
              error={profileForm.formState.errors.mobile?.message}
              {...profileForm.register("mobile")}
            />
            <div className="sm:col-span-2">
              <Button
                type="submit"
                isLoading={profileUpdateLoading || isLoadingProfile}
              >
                Save Profile
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
