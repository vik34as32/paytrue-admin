"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Textarea } from "@/components/common/Textarea";
import { Button } from "@/components/common/Button";
import { ServiceChargeRetailerPicker } from "@/components/service-charges/ServiceChargeRetailerPicker";
import { cn } from "@/lib/utils";
import {
  CHARGE_TYPE_OPTIONS,
  FREQUENCY_OPTIONS,
  MONTH_OPTIONS,
  ROLE_OPTIONS,
  STATUS_OPTIONS,
  WEEKDAY_OPTIONS,
  ServiceChargeFormValues,
  mapPlanToFormValues,
  serviceChargeEmptyDefaults,
  serviceChargeFormSchema,
} from "@/schemas/service-charge.schema";
import { ServiceChargePlan, ServiceChargeRole } from "@/types/serviceCharge";

interface ServiceChargeFormProps {
  mode: "create" | "edit";
  initialPlan?: ServiceChargePlan | null;
  isSubmitting?: boolean;
  onSubmit: (values: ServiceChargeFormValues) => void;
  onCancel: () => void;
}

export function ServiceChargeForm({
  mode,
  initialPlan,
  isSubmitting,
  onSubmit,
  onCancel,
}: ServiceChargeFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ServiceChargeFormValues>({
    resolver: zodResolver(serviceChargeFormSchema),
    defaultValues: serviceChargeEmptyDefaults,
  });

  const frequency = watch("frequency");
  const role = watch("role");
  const retailerIds = watch("retailerIds") || [];
  const showRetailerPicker = role === "RETAILER";

  useEffect(() => {
    if (mode === "edit" && initialPlan) {
      reset(mapPlanToFormValues(initialPlan));
    } else if (mode === "create") {
      reset(serviceChargeEmptyDefaults);
    }
  }, [mode, initialPlan, reset]);

  const selectRole = (next: ServiceChargeRole) => {
    setValue("role", next, { shouldValidate: true });
    if (next !== "RETAILER") {
      setValue("retailerIds", [], { shouldValidate: true });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Plan Name *"
          placeholder="Monthly retailer maintenance"
          error={errors.planName?.message}
          {...register("planName")}
        />
        <Select
          label="Status *"
          options={STATUS_OPTIONS}
          error={errors.status?.message}
          {...register("status")}
        />
        <Select
          label="Charge Type *"
          options={CHARGE_TYPE_OPTIONS}
          error={errors.chargeType?.message}
          {...register("chargeType")}
        />
        <Input
          label="Amount (₹) *"
          type="number"
          step="0.01"
          min={0}
          error={errors.amount?.message}
          {...register("amount", { valueAsNumber: true })}
        />
        <Select
          label="Frequency *"
          options={FREQUENCY_OPTIONS}
          error={errors.frequency?.message}
          {...register("frequency")}
        />
        <Input
          label="Execution Time *"
          type="time"
          error={errors.executionTime?.message}
          {...register("executionTime")}
        />
        {frequency === "WEEKLY" ? (
          <Select
            label="Execution Day *"
            options={WEEKDAY_OPTIONS}
            error={errors.executionDay?.message}
            {...register("executionDay")}
          />
        ) : frequency === "MONTHLY" || frequency === "YEARLY" ? (
          <Input
            label="Execution Day *"
            type="number"
            min={1}
            max={31}
            placeholder="1–31"
            error={errors.executionDay?.message}
            {...register("executionDay")}
          />
        ) : (
          <Input label="Execution Day" value="Every day" disabled readOnly />
        )}
        {frequency === "YEARLY" ? (
          <Select
            label="Execution Month *"
            options={MONTH_OPTIONS}
            error={errors.executionMonth?.message}
            {...register("executionMonth")}
          />
        ) : null}
        <Input
          label="Start Date *"
          type="date"
          error={errors.startDate?.message}
          {...register("startDate")}
        />
        <Input
          label="End Date"
          type="date"
          error={errors.endDate?.message}
          {...register("endDate")}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Role *</p>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((option) => {
            const active = role === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => selectRole(option.value as ServiceChargeRole)}
                className={cn(
                  "rounded-xl border px-3.5 py-2 text-sm font-medium transition",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted hover:border-primary/40 hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {errors.role?.message ? (
          <p className="mt-1 text-xs text-accent-red">{errors.role.message}</p>
        ) : null}
        <p className="mt-1.5 text-xs text-muted">
          Backend ek role accept karta hai. Retailer select karoge to particular
          retailer(s) choose karo.
        </p>
      </div>

      {showRetailerPicker ? (
        <ServiceChargeRetailerPicker
          value={retailerIds}
          onChange={(ids) =>
            setValue("retailerIds", ids, { shouldValidate: true })
          }
          error={errors.retailerIds?.message}
          disabled={isSubmitting}
        />
      ) : null}

      <Textarea
        label="Remarks"
        placeholder="Internal notes"
        error={errors.remarks?.message}
        {...register("remarks")}
      />

      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {mode === "create" ? "Create Plan" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
