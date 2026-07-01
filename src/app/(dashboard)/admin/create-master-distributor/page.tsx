"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { CreateMasterDistributorForm } from "@/components/forms/CreateMasterDistributorForm";
import { Button } from "@/components/common/Button";
import { useRoleAccess } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";
import { ArrowLeft } from "lucide-react";

export default function CreateMasterDistributorPage() {
  const { isAdminApiAuth } = useRoleAccess();
  const router = useRouter();

  useEffect(() => {
    if (!isAdminApiAuth) {
      router.replace(ROUTES.dashboard);
    }
  }, [isAdminApiAuth, router]);

  if (!isAdminApiAuth) return null;

  return (
    <div className="page-container mx-auto max-w-5xl">
      <PageHeader
        breadcrumb="Registration"
        title="Create Master Distributor"
        subtitle="Complete the multi-step registration with personal, outlet, KYC and bank details"
        action={
          <Link href={ROUTES.dashboard}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />
      <CreateMasterDistributorForm />
    </div>
  );
}
