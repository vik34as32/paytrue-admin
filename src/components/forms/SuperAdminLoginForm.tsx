"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { superAdminLoginSchema, SuperAdminLoginFormData } from "@/validations";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { superAdminLogin } from "@/store/api/superAdminAuthApi";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants";

export function SuperAdminLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading } = useAppSelector((state) => state.superAdminAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SuperAdminLoginFormData>({
    resolver: zodResolver(superAdminLoginSchema),
    defaultValues: {
    email: "care@paytrue.co.in",
    password: "l(0s107F}9Va",
  },
  });

  const onSubmit = async (data: SuperAdminLoginFormData) => {
    const result = await dispatch(superAdminLogin(data));
    if (superAdminLogin.fulfilled.match(result)) {
      toast.success("Welcome, Super Admin!");
      router.push(ROUTES.superAdminDashboard);
    } else {
      toast.error((result.payload as string) || "Login failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Email Address"
        variant="dark"
        type="email"
        value="care@paytrue.co.in"
        placeholder="superadmin@paytrue.com"
        icon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        {...register("email")}
      />
      <div>
        <Input
          label="Password"
          variant="dark"
          value="l(0s107F}9Va"
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
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPassword ? "Hide password" : "Show password"}
        </button>
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
            "Sign In as Super Admin"
          )}
        </Button>
      </motion.div>
    </form>
  );
}
