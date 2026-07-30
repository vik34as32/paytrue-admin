"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { ServiceChargeForm } from "@/components/service-charges/ServiceChargeForm";
import { useServiceChargeMutations } from "@/hooks/useServiceCharges";
import { ServiceChargeFormValues } from "@/schemas/service-charge.schema";
import { ROUTES } from "@/constants";

export function ServiceChargeCreateView() {
  const router = useRouter();
  const { createMutation } = useServiceChargeMutations();

  const handleSubmit = async (values: ServiceChargeFormValues) => {
    try {
      const created = await createMutation.mutateAsync(values);
      if (created.length === 1 && created[0]?.id) {
        router.push(`${ROUTES.superAdminServiceCharges}/${created[0].id}`);
      } else {
        router.push(ROUTES.superAdminServiceCharges);
      }
    } catch {
      // toast handled in mutation
    }
  };

  return (
    <div className="page-container space-y-6">
      <PageHeader
        breadcrumb="Finance"
        title="Create Service Charge Plan"
        subtitle="FIXED charge for a role. Retailer role pe particular retailer(s) select karo."
      />
      <Card>
        <ServiceChargeForm
          mode="create"
          isSubmitting={createMutation.isPending}
          onSubmit={(values) => void handleSubmit(values)}
          onCancel={() => router.push(ROUTES.superAdminServiceCharges)}
        />
      </Card>
    </div>
  );
}
