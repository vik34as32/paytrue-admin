"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createAdminSchema, CreateAdminFormData } from "@/validations";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Mail, Phone, Lock, User, Shield, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { createAdminAccount, fetchAllAdmins } from "@/store/api/superAdminWalletApi";
import { CreateAdminPayload } from "@/types/superAdmin";

interface CreateAdminFormProps {
  onSuccess?: () => void;
}

export function CreateAdminForm({ onSuccess }: CreateAdminFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const { createAdminLoading } = useAppSelector((state) => state.superAdminWallet);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
  });

  const handleFormSubmit = async (data: CreateAdminFormData) => {
    const payload: CreateAdminPayload = {
      email: data.email,
      mobile: data.mobile,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      userType: "ADMIN",
    };

    const result = await dispatch(createAdminAccount(payload));
    if (createAdminAccount.fulfilled.match(result)) {
      toast.success("Admin created successfully");
      reset();
      dispatch(fetchAllAdmins());
      onSuccess?.();
    } else {
      toast.error((result.payload as string) || "Failed to create admin");
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-6"
    >
      <Card className="border-primary/10 bg-gradient-to-br from-card to-primary/[0.02]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Account Credentials</h3>
            <p className="text-xs text-muted">Login details for the new admin</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Email Address"
            type="email"
            placeholder="admin@paytrue.com"
            icon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Mobile Number"
            placeholder="9876543210"
            icon={<Phone className="h-4 w-4" />}
            error={errors.mobile?.message}
            {...register("mobile")}
          />
          <div>
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              icon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="mt-1 flex items-center gap-1 text-xs text-muted hover:text-primary"
            >
              {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter password"
            icon={<Lock className="h-4 w-4" />}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>
      </Card>

      <Card>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Personal Information</h3>
            <p className="text-xs text-muted">Admin profile details</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First Name"
            placeholder="John"
            icon={<User className="h-4 w-4" />}
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            icon={<User className="h-4 w-4" />}
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => reset()}>
          Reset Form
        </Button>
        <Button type="submit" size="lg" isLoading={createAdminLoading}>
          Create Admin Account
        </Button>
      </div>
    </motion.form>
  );
}
