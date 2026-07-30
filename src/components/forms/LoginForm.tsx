"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail, Phone } from "lucide-react";
import {
  adminEmailLoginSchema,
  AdminEmailLoginFormData,
  toAdminLoginPayload,
} from "@/validations";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { adminLoginUser } from "@/store/api/authApi";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants";
import Link from "next/link";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AdminEmailLoginFormData>({
    resolver: zodResolver(adminEmailLoginSchema),
    defaultValues: { identifier: "", password: "", rememberMe: true },
  });

  const identifier = watch("identifier") || "";
  const looksLikeEmail = useMemo(
    () => identifier.includes("@") || /[a-zA-Z]/.test(identifier),
    [identifier]
  );

  const onSubmit = async (data: AdminEmailLoginFormData) => {
    const credentials = toAdminLoginPayload(data);
    const result = await dispatch(
      adminLoginUser({ ...credentials, rememberMe: data.rememberMe })
    );
    if (adminLoginUser.fulfilled.match(result)) {
      toast.success("Welcome back!");
      router.replace(ROUTES.adminDashboard);
    } else {
      toast.error((result.payload as string) || "Login failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Email or Mobile"
        variant="dark"
        type="text"
        inputMode={looksLikeEmail ? "email" : "numeric"}
        autoComplete="username"
        placeholder="admin@paytrue.com or 9876543210"
        icon={
          looksLikeEmail ? (
            <Mail className="h-4 w-4" />
          ) : (
            <Phone className="h-4 w-4" />
          )
        }
        error={errors.identifier?.message}
        {...register("identifier")}
      />
      <div>
        <Input
          label="Password"
          variant="dark"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          icon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          {...register("password")}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="mt-2 flex items-center gap-2 text-xs text-slate-400 hover:text-blue-400"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          {showPassword ? "Hide password" : "Show password"}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-500"
            {...register("rememberMe")}
          />
          Remember me
        </label>
        <Link
          href={ROUTES.forgotPassword}
          className="text-sm font-medium text-blue-400 hover:text-blue-300"
        >
          Forgot password?
        </Link>
      </div>

      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </motion.div>
    </form>
  );
}
