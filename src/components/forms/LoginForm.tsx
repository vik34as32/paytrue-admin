"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginSchema, LoginFormData } from "@/validations";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { loginUser } from "@/store/api/authApi";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { HiOutlinePhone, HiOutlineLockClosed, HiEye, HiEyeOff } from "react-icons/hi";
import { DEMO_CREDENTIALS, ROUTES } from "@/constants";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    const result = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(result)) {
      toast.success("Welcome back!");
      router.push(ROUTES.dashboard);
    } else {
      toast.error((result.payload as string) || "Login failed");
    }
  };

  const fillDemo = (mobile: string, password: string) => {
    setValue("mobile", mobile);
    setValue("password", password);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Mobile Number"
        placeholder="Enter 10-digit mobile number"
        icon={<HiOutlinePhone className="h-4 w-4" />}
        error={errors.mobile?.message}
        {...register("mobile")}
      />
      <div>
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          icon={<HiOutlineLockClosed className="h-4 w-4" />}
          error={errors.password?.message}
          {...register("password")}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="mt-1 flex items-center gap-1 text-xs text-muted hover:text-primary"
        >
          {showPassword ? (
            <HiEyeOff className="h-3.5 w-3.5" />
          ) : (
            <HiEye className="h-3.5 w-3.5" />
          )}
          {showPassword ? "Hide" : "Show"} Password
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          {...register("rememberMe")}
        />
        Remember Me
      </label>
      <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
        Sign In
      </Button>

      <div className="rounded-xl border border-border bg-background/50 p-4">
        <p className="mb-2 text-xs font-semibold text-muted uppercase">
          Demo Credentials
        </p>
        <div className="space-y-1">
          {DEMO_CREDENTIALS.map((cred) => (
            <button
              key={cred.mobile}
              type="button"
              onClick={() => fillDemo(cred.mobile, cred.password)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-card transition-colors"
            >
              <span className="font-medium">{cred.role}</span>
              <span className="text-muted">{cred.mobile}</span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
