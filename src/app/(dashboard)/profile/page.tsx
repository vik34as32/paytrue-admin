"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { updateUser } from "@/store/slices/authSlice";
import {
  profileSchema,
  changePasswordSchema,
  ProfileFormData,
  ChangePasswordFormData,
} from "@/validations";
import { Card, CardHeader } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { ROLES } from "@/constants";
import { formatCurrency, getInitials } from "@/lib/utils";
import { mockApi } from "@/services/mockApi";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [avatar, setAvatar] = useState(user?.avatar || "");

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      mobile: user?.mobile || "",
    },
  });

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const handleProfileUpdate = async (data: ProfileFormData) => {
    if (!user) return;
    await mockApi.updateUser(user.id, data, user.id);
    dispatch(updateUser(data));
    toast.success("Profile updated successfully");
  };

  const handlePasswordChange = async (data: ChangePasswordFormData) => {
    toast.success("Password changed successfully");
    passwordForm.reset();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatar(result);
      dispatch(updateUser({ avatar: result }));
      toast.success("Profile image updated");
    };
    reader.readAsDataURL(file);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted">Manage your account settings</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-2xl font-bold text-white overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  getInitials(user.name)
                )}
              </div>
              <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-primary p-1.5 text-white hover:bg-primary/90">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
            </div>
            <h2 className="text-lg font-bold">{user.name}</h2>
            <p className="text-sm text-muted">{ROLES[user.role]}</p>
            <p className="mt-2 text-lg font-semibold text-primary">
              {formatCurrency(user.balance)}
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
        </Card>
      </div>

      <Card>
        <CardHeader title="Change Password" />
        <form
          onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
          className="grid gap-4 sm:grid-cols-2 max-w-2xl"
        >
          <Input
            label="Current Password"
            type="password"
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register("currentPassword")}
          />
          <div />
          <Input
            label="New Password"
            type="password"
            error={passwordForm.formState.errors.newPassword?.message}
            {...passwordForm.register("newPassword")}
          />
          <Input
            label="Confirm Password"
            type="password"
            error={passwordForm.formState.errors.confirmPassword?.message}
            {...passwordForm.register("confirmPassword")}
          />
          <div className="sm:col-span-2">
            <Button type="submit">Change Password</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
