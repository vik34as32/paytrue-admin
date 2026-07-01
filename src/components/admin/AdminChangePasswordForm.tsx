"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import {
  changePasswordSchema,
  ChangePasswordFormData,
} from "@/validations";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { updateAdminPassword } from "@/store/api/adminModuleApi";
import { clearAdminModuleError } from "@/store/slices/adminModuleSlice";

export function AdminChangePasswordForm() {
  const dispatch = useAppDispatch();
  const { changePasswordLoading, error } = useAppSelector(
    (state) => state.adminModule
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    dispatch(clearAdminModuleError());
    const result = await dispatch(
      updateAdminPassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
    );
    if (updateAdminPassword.fulfilled.match(result)) {
      toast.success("Password changed successfully");
      reset();
      return;
    }
    toast.error((result.payload as string) || "Failed to change password");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-4 sm:grid-cols-2 max-w-2xl"
    >
      {error && (
        <div className="sm:col-span-2 rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}
      <Input
        label="Current Password"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />
      <div className="hidden sm:block" />
      <Input
        label="New Password"
        type="password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <Input
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <div className="sm:col-span-2">
        <Button
          type="submit"
          isLoading={changePasswordLoading}
          disabled={changePasswordLoading}
        >
          Change Password
        </Button>
      </div>
    </form>
  );
}
