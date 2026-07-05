"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createAdminSchema, CreateAdminFormData } from "@/validations";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { EmailVerificationField } from "@/components/common/EmailVerificationField";
import { Phone, Lock, User, Shield, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { createAdminAccount, fetchAllAdmins } from "@/store/api/superAdminWalletApi";
import { CreateAdminPayload } from "@/types/superAdmin";
import {
  EMAIL_VERIFICATION_REQUIRED_MESSAGE,
  USER_CREATED_SUCCESS_MESSAGE,
  useEmailVerification,
} from "@/hooks/useEmailVerification";

interface CreateAdminFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  variant?: "page" | "modal";
  isOpen?: boolean;
}

export function CreateAdminForm({
  onSuccess,
  onCancel,
  variant = "page",
  isOpen = true,
}: CreateAdminFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const { createAdminLoading } = useAppSelector((state) => state.superAdminWallet);
  const isModal = variant === "modal";

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
  });

  const email = watch("email") || "";
  const emailVerification = useEmailVerification(email);

  const handleReset = () => {
    reset();
    emailVerification.resetVerification();
    setShowPassword(false);
  };

  useEffect(() => {
    if (isModal && !isOpen) {
      handleReset();
    }
  }, [isModal, isOpen]);

  const handleFormSubmit = async (data: CreateAdminFormData) => {
    if (!emailVerification.isVerified) {
      toast.error(EMAIL_VERIFICATION_REQUIRED_MESSAGE);
      return;
    }

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
      toast.success(USER_CREATED_SUCCESS_MESSAGE);
      handleReset();
      dispatch(fetchAllAdmins());
      onSuccess?.();
    } else {
      toast.error((result.payload as string) || "Failed to create admin");
    }
  };

  const formBody = (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <Card
        className={cn(
          "border-primary/10 bg-gradient-to-br from-card to-primary/[0.02]",
          isModal && "border-border shadow-none"
        )}
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Account Credentials</h3>
            <p className="text-xs text-muted">Login details for the new admin</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <EmailVerificationField
            email={email}
            onEmailChange={(value) =>
              setValue("email", value, { shouldValidate: true })
            }
            verification={emailVerification}
            label="Email Address"
            placeholder="admin@paytrue.com"
            error={errors.email?.message}
            className="space-y-2 sm:col-span-2"
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
              {showPassword ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
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

      <Card className={cn(isModal && "border-border shadow-none")}>
        <div className="mb-5 flex items-center gap-3">
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

      <div
        className={cn(
          "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end",
          isModal && "border-t border-border pt-4"
        )}
      >
        {isModal ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createAdminLoading}
          >
            Cancel
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset Form
          </Button>
        )}
        <Button
          type="submit"
          size={isModal ? "md" : "lg"}
          isLoading={createAdminLoading}
          disabled={!emailVerification.isVerified || createAdminLoading}
        >
          Create Admin Account
        </Button>
      </div>
    </form>
  );

  if (isModal) {
    return formBody;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {formBody}
    </motion.div>
  );
}
