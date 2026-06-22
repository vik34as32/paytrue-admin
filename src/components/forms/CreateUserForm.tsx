"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, CreateUserFormData } from "@/validations";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Button } from "@/components/common/Button";
import { ROLES, ROLE_CAN_CREATE } from "@/constants";
import { UserRole } from "@/types";

interface CreateUserFormProps {
  onSubmit: (data: CreateUserFormData) => void;
  isLoading?: boolean;
  parentOptions?: { value: string; label: string }[];
  creatorRole: UserRole;
}

export function CreateUserForm({
  onSubmit,
  isLoading,
  parentOptions = [],
  creatorRole,
}: CreateUserFormProps) {
  const allowedRoles = ROLE_CAN_CREATE[creatorRole] || [];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: allowedRoles[0] },
  });

  const selectedRole = watch("role");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full Name" error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <Input label="Mobile" error={errors.mobile?.message} {...register("mobile")} />
        <Select
          label="Role"
          options={allowedRoles.map((r) => ({
            value: r,
            label: ROLES[r],
          }))}
          error={errors.role?.message}
          {...register("role")}
        />
        <Input
          label="Password"
          type="password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm Password"
          type="password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        {parentOptions.length > 0 && selectedRole !== "admin" && (
          <Select
            label="Parent User"
            options={[{ value: "", label: "Select parent" }, ...parentOptions]}
            error={errors.parentId?.message}
            {...register("parentId")}
          />
        )}
        <Input
          label="Initial Balance"
          type="number"
          error={errors.balance?.message}
          {...register("balance", { valueAsNumber: true })}
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="submit" isLoading={isLoading}>
          Create User
        </Button>
      </div>
    </form>
  );
}
