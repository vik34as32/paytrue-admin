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
import { updateSuperAdminPassword } from "@/store/api/superAdminApi";
import { clearSuperAdminError } from "@/store/slices/superAdminSlice";

interface ChangePasswordFormProps {
  className?: string;
}

export function ChangePasswordForm({ className }: ChangePasswordFormProps) {
  const dispatch = useAppDispatch();
  const { changePasswordLoading, error } = useAppSelector(
    (state) => state.superAdmin
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
    dispatch(clearSuperAdminError());
    const result = await dispatch(
      updateSuperAdminPassword({
        oldPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      })
    );

    if (updateSuperAdminPassword.fulfilled.match(result)) {
      toast.success("Password changed successfully");
      reset();
      return;
    }

    const message =
      (result.payload as string) || "Failed to change password";
    toast.error(message);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={className ?? "grid gap-4 sm:grid-cols-2 max-w-2xl"}
    >
      {error && (
        <div className="sm:col-span-2 rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <Input
        label="Current Password"
        type="password"
        revealable
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />
      <div className="hidden sm:block" />
      <Input
        label="New Password"
        type="password"
        revealable
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <Input
        label="Confirm Password"
        type="password"
        revealable
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
