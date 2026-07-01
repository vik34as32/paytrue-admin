"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { ChangePasswordForm } from "@/components/super-admin/ChangePasswordForm";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { ROUTES } from "@/constants";
import { Lock } from "lucide-react";

export default function SuperAdminChangePasswordPage() {
  const router = useRouter();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [hasSuperAdminWalletAccess, router]);

  if (!hasSuperAdminWalletAccess) return null;

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Super Admin"
        title="Change Password"
        subtitle="Update your super admin account password"
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
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
