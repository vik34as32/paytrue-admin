"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { CreateAdminForm } from "@/components/forms/CreateAdminForm";
import { Button } from "@/components/common/Button";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { ROUTES } from "@/constants";
import { ArrowLeft } from "lucide-react";

export default function CreateAdminPage() {
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [hasSuperAdminWalletAccess, router]);

  if (!hasSuperAdminWalletAccess) return null;

  return (
    <div className="page-container mx-auto max-w-4xl">
      <PageHeader
        breadcrumb="Super Admin"
        title="Create Admin"
        subtitle="Register a new administrator with full platform access credentials"
        action={
          <Link href={ROUTES.superAdminAdmins}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />
      <CreateAdminForm onSuccess={() => router.push(ROUTES.superAdminAdmins)} />
    </div>
  );
}
