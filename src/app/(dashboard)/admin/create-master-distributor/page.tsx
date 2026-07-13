"use client";

import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { UserMultiStepForm } from "@/components/forms/UserMultiStepForm";
import { Button } from "@/components/common/Button";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ROUTES } from "@/constants";
import { ArrowLeft } from "lucide-react";

export default function CreateMasterDistributorPage() {
  return (
    <AdminPageShell>
      <div className="page-container mx-auto max-w-5xl">
        <PageHeader
          breadcrumb="Admin"
          title="Create Master Distributor"
          subtitle="Complete the multi-step registration with personal, outlet, KYC and bank details"
          action={
            <Link href={ROUTES.adminMasterDistributor}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          }
        />
        <UserMultiStepForm
          userType="MASTER_DISTRIBUTOR"
          requireEmailVerification
          requireMobileVerification
          submitLabel="Create Master Distributor"
          successTitle="Master Distributor Created!"
          successMessage="The master distributor has been onboarded successfully. Login credentials have been sent to the registered email."
          successToast="User created successfully. Login credentials have been sent to the registered email."
          successRedirect={ROUTES.adminMasterDistributor}
        />
      </div>
    </AdminPageShell>
  );
}
