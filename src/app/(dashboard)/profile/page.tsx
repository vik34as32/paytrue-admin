"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { useRoleAccess } from "@/hooks/useAuth";
import { updateUser } from "@/store/slices/authSlice";
import {
  profileSchema,
  superAdminProfileSchema,
  ProfileFormData,
  SuperAdminProfileFormData,
} from "@/validations";
import { ChangePasswordForm } from "@/components/super-admin/ChangePasswordForm";
import { AdminChangePasswordForm } from "@/components/admin/AdminChangePasswordForm";
import {
  fetchSuperAdminProfile,
  updateSuperAdminProfile,
} from "@/store/api/superAdminApi";
import {
  fetchAdminProfile,
  updateAdminProfile,
} from "@/store/api/adminModuleApi";
import {
  selectAdminProfile,
  selectAdminBalance,
  resolveAdminPrimaryBalance,
} from "@/store/selectors/adminSelectors";
import { Card, CardHeader } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { ROLES } from "@/constants";
import { formatCurrency, getInitials } from "@/lib/utils";
import { resolvePrimaryBalance } from "@/lib/walletBalance";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user, isSuperAdminApiAuth, isAdminApiAuth } = useRoleAccess();
  const superAdminProfile = useAppSelector((state) => state.superAdmin.profile);
  const walletBalance = useAppSelector((state) => state.superAdminWallet.balance);
  const adminProfile = useAppSelector(selectAdminProfile);
  const adminBalance = useAppSelector(selectAdminBalance);
  const {
    isLoadingProfile,
    profileUpdateLoading,
    error: superAdminError,
  } = useAppSelector((state) => state.superAdmin);
  const {
    isLoadingProfile: isLoadingAdminProfile,
    profileUpdateLoading: adminProfileUpdateLoading,
    error: adminError,
  } = useAppSelector((state) => state.adminModule);
  const [avatar, setAvatar] = useState(user?.avatar || "");

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      mobile: user?.mobile || "",
    },
  });

  const superAdminProfileForm = useForm<SuperAdminProfileFormData>({
    resolver: zodResolver(superAdminProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
    },
  });

  const adminProfileForm = useForm<SuperAdminProfileFormData>({
    resolver: zodResolver(superAdminProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
    },
  });

  useEffect(() => {
    if (isSuperAdminApiAuth) {
      dispatch(fetchSuperAdminProfile());
    } else if (isAdminApiAuth) {
      dispatch(fetchAdminProfile());
    }
  }, [dispatch, isSuperAdminApiAuth, isAdminApiAuth]);

  useEffect(() => {
    if (superAdminProfile) {
      superAdminProfileForm.reset({
        firstName: superAdminProfile.firstName || "",
        lastName: superAdminProfile.lastName || "",
        email: superAdminProfile.email || "",
        mobile: (superAdminProfile as { mobile?: string }).mobile || "",
      });
    }
  }, [superAdminProfile, superAdminProfileForm]);

  useEffect(() => {
    if (adminProfile) {
      adminProfileForm.reset({
        firstName: adminProfile.firstName || "",
        lastName: adminProfile.lastName || "",
        email: adminProfile.email || "",
        mobile: adminProfile.mobile || "",
      });
    }
  }, [adminProfile, adminProfileForm]);

  const handleProfileUpdate = async (data: ProfileFormData) => {
    if (!user) return;
    dispatch(updateUser(data));
    toast.success("Profile updated");
  };

  const handleSuperAdminProfileUpdate = async (
    data: SuperAdminProfileFormData
  ) => {
    const result = await dispatch(
      updateSuperAdminProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        mobile: data.mobile,
      })
    );
    if (updateSuperAdminProfile.fulfilled.match(result)) {
      toast.success("Profile updated");
    } else {
      toast.error((result.payload as string) || "Failed to update profile");
    }
  };

  const handleAdminProfileUpdate = async (data: SuperAdminProfileFormData) => {
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isSuperAdminApiAuth || isAdminApiAuth) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatar(result);
      dispatch(updateUser({ avatar: result }));
      toast.success("Profile image updated");
    };
    reader.readAsDataURL(file);
  };

  if (!user && !isSuperAdminApiAuth) return null;

  const displayName = isSuperAdminApiAuth
    ? superAdminProfile?.name ||
      [superAdminProfile?.firstName, superAdminProfile?.lastName]
        .filter(Boolean)
        .join(" ") ||
      superAdminProfile?.email ||
      "Super Admin"
    : isAdminApiAuth
      ? adminProfile?.name ||
        [adminProfile?.firstName, adminProfile?.lastName]
          .filter(Boolean)
          .join(" ") ||
        adminProfile?.email ||
        user?.name ||
        "Admin"
      : user?.name || "";

  const displayBalance = isSuperAdminApiAuth
    ? resolvePrimaryBalance(walletBalance)
    : isAdminApiAuth
      ? resolveAdminPrimaryBalance(adminBalance)
      : user?.balance || 0;

  const error = isSuperAdminApiAuth
    ? superAdminError
    : isAdminApiAuth
      ? adminError
      : null;

  const roleLabel = isSuperAdminApiAuth
    ? ROLES.super_admin
    : user
      ? ROLES[user.role]
      : "";

  const showAvatarUpload = !isSuperAdminApiAuth && !isAdminApiAuth;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted">Manage your account settings</p>
      </div>

      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-2xl font-bold text-white overflow-hidden">
                {avatar && showAvatarUpload ? (
                  <img
                    src={avatar}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(displayName)
                )}
              </div>
              {showAvatarUpload && (
                <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-primary p-1.5 text-white hover:bg-primary/90">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </label>
              )}
            </div>
            <h2 className="text-lg font-bold">{displayName}</h2>
            <p className="text-sm text-muted">{roleLabel}</p>
            <p className="mt-2 text-lg font-semibold text-primary">
              {formatCurrency(displayBalance)}
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Update Profile" />
          {isSuperAdminApiAuth ? (
            <form
              onSubmit={superAdminProfileForm.handleSubmit(
                handleSuperAdminProfileUpdate
              )}
              className="grid gap-4 sm:grid-cols-2"
            >
              <Input
                label="First Name"
                error={superAdminProfileForm.formState.errors.firstName?.message}
                {...superAdminProfileForm.register("firstName")}
              />
              <Input
                label="Last Name"
                error={superAdminProfileForm.formState.errors.lastName?.message}
                {...superAdminProfileForm.register("lastName")}
              />
              <Input
                label="Email"
                type="email"
                error={superAdminProfileForm.formState.errors.email?.message}
                {...superAdminProfileForm.register("email")}
              />
              <Input
                label="Mobile"
                error={superAdminProfileForm.formState.errors.mobile?.message}
                {...superAdminProfileForm.register("mobile")}
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
          ) : isAdminApiAuth ? (
            <form
              onSubmit={adminProfileForm.handleSubmit(handleAdminProfileUpdate)}
              className="grid gap-4 sm:grid-cols-2"
            >
              <Input
                label="First Name"
                error={adminProfileForm.formState.errors.firstName?.message}
                {...adminProfileForm.register("firstName")}
              />
              <Input
                label="Last Name"
                error={adminProfileForm.formState.errors.lastName?.message}
                {...adminProfileForm.register("lastName")}
              />
              <Input
                label="Email"
                type="email"
                error={adminProfileForm.formState.errors.email?.message}
                {...adminProfileForm.register("email")}
              />
              <Input
                label="Mobile"
                error={adminProfileForm.formState.errors.mobile?.message}
                {...adminProfileForm.register("mobile")}
              />
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  isLoading={adminProfileUpdateLoading || isLoadingAdminProfile}
                >
                  Save Profile
                </Button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={profileForm.handleSubmit(handleProfileUpdate)}
              className="grid gap-4 sm:grid-cols-2"
            >
              <Input
                label="Full Name"
                error={profileForm.formState.errors.name?.message}
                {...profileForm.register("name")}
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
                <Button type="submit">Save Profile</Button>
              </div>
            </form>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Change Password" />
        {isSuperAdminApiAuth ? (
          <ChangePasswordForm />
        ) : isAdminApiAuth ? (
          <AdminChangePasswordForm />
        ) : (
          <p className="text-sm text-muted">
            Password change is available for admin accounts via the Change
            Password menu item.
          </p>
        )}
      </Card>
    </div>
  );
}
