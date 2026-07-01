"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { AdminChangePasswordForm } from "@/components/admin/AdminChangePasswordForm";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Lock } from "lucide-react";

export default function AdminChangePasswordPage() {
  return (
    <AdminPageShell>
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
    </AdminPageShell>
  );
}
