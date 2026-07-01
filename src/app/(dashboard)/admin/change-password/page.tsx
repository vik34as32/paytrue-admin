"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { AdminChangePasswordForm } from "@/components/admin/AdminChangePasswordForm";
import { useRoleAccess } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";
import { Lock } from "lucide-react";

export default function AdminChangePasswordPage() {
  const router = useRouter();
  const { isAdminApiAuth } = useRoleAccess();

  useEffect(() => {
    if (!isAdminApiAuth) {
      router.replace(ROUTES.login);
    }
  }, [isAdminApiAuth, router]);

  if (!isAdminApiAuth) return null;

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Admin"
        title="Change Password"
        subtitle="Update your admin account password"
      />
      <Card className="max-w-3xl">
        <CardHeader
          title="Security"
          subtitle="Use a strong password with uppercase, lowercase, and numbers"
          action={
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
          }
        />
        <AdminChangePasswordForm />
      </Card>
    </div>
  );
}
