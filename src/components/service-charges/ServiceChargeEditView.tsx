"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { ServiceChargeForm } from "@/components/service-charges/ServiceChargeForm";
import {
  useServiceChargeDetail,
  useServiceChargeMutations,
} from "@/hooks/useServiceCharges";
import { ServiceChargeFormValues } from "@/schemas/service-charge.schema";
import { ROUTES } from "@/constants";

interface ServiceChargeEditViewProps {
  planId: string;
}

export function ServiceChargeEditView({ planId }: ServiceChargeEditViewProps) {
  const router = useRouter();
  const { data: plan, isLoading, isError, error } = useServiceChargeDetail(
    planId
  );
  const { updateMutation } = useServiceChargeMutations();

  const handleSubmit = async (values: ServiceChargeFormValues) => {
    try {
      await updateMutation.mutateAsync({ id: planId, payload: values });
      router.push(`${ROUTES.superAdminServiceCharges}/${planId}`);
    } catch {
      // toast handled in mutation
    }
  };

  if (isLoading) {
    return (
      <div className="page-container space-y-6">
        <PageHeader breadcrumb="Finance" title="Edit Service Charge Plan" />
        <Card>
          <div className="animate-pulse space-y-4">
            <div className="h-10 rounded-xl bg-muted" />
            <div className="h-10 rounded-xl bg-muted" />
            <div className="h-24 rounded-xl bg-muted" />
          </div>
        </Card>
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="page-container space-y-6">
        <PageHeader breadcrumb="Finance" title="Edit Service Charge Plan" />
        <Card>
          <p className="text-sm text-accent-red">
            {error instanceof Error ? error.message : "Plan not found"}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => router.push(ROUTES.superAdminServiceCharges)}
          >
            Back to list
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      <PageHeader
        breadcrumb="Finance"
        title="Edit Service Charge Plan"
        subtitle={plan.planName}
      />
      <Card>
        <ServiceChargeForm
          mode="edit"
          initialPlan={plan}
          isSubmitting={updateMutation.isPending}
          onSubmit={(values) => void handleSubmit(values)}
          onCancel={() =>
            router.push(`${ROUTES.superAdminServiceCharges}/${planId}`)
          }
        />
      </Card>
    </div>
  );
}
