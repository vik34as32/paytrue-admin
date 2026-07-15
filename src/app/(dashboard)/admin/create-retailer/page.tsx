"use client";

import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { UserMultiStepForm } from "@/components/forms/UserMultiStepForm";
import { Button } from "@/components/common/Button";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ROUTES } from "@/constants";
import { ArrowLeft } from "lucide-react";

export default function CreateRetailerPage() {
  return (
    <AdminPageShell>
      <div className="page-container mx-auto max-w-5xl">
        <PageHeader
          breadcrumb="Admin"
          title="Create Retailer"
          subtitle="Complete the multi-step registration with personal, outlet, KYC and bank details"
          action={
            <Link href={ROUTES.adminRetailers}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          }
        />
        <UserMultiStepForm
          userType="RETAILER"
          requireEmailVerification
          requireMobileVerification
          submitLabel="Create Retailer"
          successTitle="Retailer Created!"
          successMessage="The retailer has been onboarded successfully. Login credentials have been sent to the registered email."
          successToast="Retailer created successfully."
          successRedirect={ROUTES.adminRetailers}
        />
      </div>
    </AdminPageShell>
  );
}
