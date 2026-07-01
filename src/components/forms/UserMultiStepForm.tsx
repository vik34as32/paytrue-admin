"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  FormProvider,
  UseFormReturn,
  FieldValues,
  Path,
} from "react-hook-form";
import { toast } from "sonner";
import { ZodIssue } from "zod";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { ImageUpload } from "@/components/common/ImageUpload";
import { VideoUpload } from "@/components/common/VideoUpload";
import { PasswordStrengthMeter } from "@/components/common/PasswordStrengthMeter";
import { SuccessModal } from "@/components/common/SuccessModal";
import {
  AdminCreateUserType,
  USER_FORM_STEPS,
  userFormEmptyDefaults,
  UserFormValues,
} from "@/validations/userStepSchemas";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { useRoleAccess } from "@/hooks/useAuth";
import { registerUser } from "@/store/api/adminModuleApi";

function FormField<T extends FieldValues>({
  name,
  label,
  type = "text",
  placeholder,
  methods,
}: {
  name: Path<T>;
  label: string;
  type?: string;
  placeholder?: string;
  methods: UseFormReturn<T>;
}) {
  const {
    register,
    formState: { errors },
  } = methods;

  const error = errors[name]?.message as string | undefined;

  return (
    <Input
      label={label}
      type={type}
      placeholder={placeholder}
      error={error}
      {...register(name)}
    />
  );
}

function PreviewSection({
  title,
  items,
}: {
  title: string;
  items: [string, string | undefined][];
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <h4 className="mb-3 text-sm font-bold text-foreground">{title}</h4>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              {label}
            </p>
            <p className="text-sm font-medium text-foreground">{value || "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface UserMultiStepFormProps {
  userType: AdminCreateUserType;
  submitLabel: string;
  successTitle: string;
  successMessage: string;
  successRedirect: string;
  successToast?: string;
}

export function UserMultiStepForm({
  userType,
  submitLabel,
  successTitle,
  successMessage,
  successRedirect,
  successToast,
}: UserMultiStepFormProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAdminApiAuth } = useRoleAccess();
  const { createUserLoading } = useAppSelector((state) => state.adminModule);

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const methods = useForm<UserFormValues>({
    defaultValues: userFormEmptyDefaults,
    mode: "onBlur",
  });

  const {
    handleSubmit,
    watch,
    setValue,
    setError,
    getValues,
    reset,
    formState: { errors },
  } = methods;

  const password = watch("password");
  const values = watch();

  const setFile = (field: keyof UserFormValues, file: File | null) => {
    setValue(field, file as UserFormValues[typeof field], {
      shouldValidate: true,
    });
  };

  const applyStepErrors = (issues: ZodIssue[]) => {
    issues.forEach((issue) => {
      const path = issue.path[0];
      if (typeof path === "string") {
        setError(path as keyof UserFormValues, { message: issue.message });
      }
    });
  };

  const goNext = async () => {
    const currentSchema = USER_FORM_STEPS[step - 1]?.schema;
    if (currentSchema) {
      const result = currentSchema.safeParse(getValues());
      if (!result.success) {
        applyStepErrors(result.error.issues);
        toast.error("Please fix validation errors before continuing");
        return;
      }
    }
    setStep((current) => Math.min(current + 1, USER_FORM_STEPS.length));
  };

  const goBack = () => setStep((current) => Math.max(current - 1, 1));

  const onSubmit = async () => {
    const data = getValues();

    if (isAdminApiAuth) {
      const result = await dispatch(registerUser({ data, userType }));
      if (registerUser.fulfilled.match(result)) {
        toast.success(successToast || "User created successfully");
        setSuccessOpen(true);
        reset(userFormEmptyDefaults);
        setStep(1);
      } else {
        toast.error((result.payload as string) || "Failed to create user");
      }
      return;
    }

    toast.success(successToast || "Registration submitted (UI preview)");
    setSuccessOpen(true);
    reset(userFormEmptyDefaults);
    setStep(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {USER_FORM_STEPS.map((formStep) => (
          <div
            key={formStep.id}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
              step === formStep.id
                ? "bg-primary text-primary-foreground"
                : step > formStep.id
                  ? "bg-accent-green/10 text-accent-green"
                  : "bg-background text-muted"
            }`}
          >
            {step > formStep.id ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              formStep.id
            )}
            <span className="hidden sm:inline">{formStep.title}</span>
          </div>
        ))}
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(step === 5 ? onSubmit : goNext)}>
          <Card>
            <CardHeader
              title={USER_FORM_STEPS[step - 1].title}
              subtitle={`Step ${step} of ${USER_FORM_STEPS.length}`}
            />

            <div className="space-y-6">
              {step === 1 && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <FormField name="firstName" label="First Name" placeholder="Enter first name" methods={methods} />
                  <FormField name="lastName" label="Last Name" placeholder="Enter last name" methods={methods} />
                  <FormField name="email" label="Email" type="email" placeholder="Enter email" methods={methods} />
                  <FormField name="mobile" label="Mobile" placeholder="10-digit mobile" methods={methods} />
                  <FormField name="alternateMobileNumber" label="Alternate Mobile" placeholder="Optional" methods={methods} />
                  <div className="space-y-2">
                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Create password"
                      error={errors.password?.message}
                      {...methods.register("password")}
                    />
                    <button
                      type="button"
                      className="text-xs font-semibold text-primary"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? "Hide password" : "Show password"}
                    </button>
                    <PasswordStrengthMeter password={password} />
                  </div>
                  <div className="lg:col-span-2">
                    <ImageUpload
                      label="Profile Image"
                      file={values.profileImage}
                      onChange={(file) => setFile("profileImage", file)}
                      error={errors.profileImage?.message as string | undefined}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <FormField name="outletName" label="Outlet Name" placeholder="Enter outlet name" methods={methods} />
                  <FormField name="businessType" label="Business Type" placeholder="e.g. Retail, Franchise" methods={methods} />
                  <FormField name="gstNumber" label="GST Number" placeholder="Optional" methods={methods} />
                  <FormField name="address" label="Address" placeholder="Full address" methods={methods} />
                  <FormField name="state" label="State" placeholder="State" methods={methods} />
                  <FormField name="district" label="District" placeholder="District" methods={methods} />
                  <FormField name="city" label="City" placeholder="City" methods={methods} />
                  <FormField name="village" label="Village" placeholder="Optional" methods={methods} />
                  <FormField name="pincode" label="Pincode" placeholder="6-digit pincode" methods={methods} />
                  <FormField name="latitude" label="Latitude" placeholder="Optional" methods={methods} />
                  <FormField name="longitude" label="Longitude" placeholder="Optional" methods={methods} />
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <FormField name="aadhaarNumber" label="Aadhaar Number" placeholder="12-digit Aadhaar" methods={methods} />
                  <FormField name="panNumber" label="PAN Number" placeholder="PAN number" methods={methods} />
                  <ImageUpload label="Aadhaar Front" file={values.aadhaarFront} onChange={(file) => setFile("aadhaarFront", file)} error={errors.aadhaarFront?.message as string | undefined} />
                  <ImageUpload label="Aadhaar Back" file={values.aadhaarBack} onChange={(file) => setFile("aadhaarBack", file)} error={errors.aadhaarBack?.message as string | undefined} />
                  <ImageUpload label="PAN Card" file={values.panCard} onChange={(file) => setFile("panCard", file)} error={errors.panCard?.message as string | undefined} />
                  <ImageUpload label="Owner Photo" file={values.ownerPhoto} onChange={(file) => setFile("ownerPhoto", file)} error={errors.ownerPhoto?.message as string | undefined} />
                  <div className="lg:col-span-2">
                    <VideoUpload label="Video Verification" file={values.videoVerification} onChange={(file) => setFile("videoVerification", file)} error={errors.videoVerification?.message as string | undefined} />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <FormField name="accountHolderName" label="Account Holder Name" placeholder="As per bank" methods={methods} />
                  <FormField name="bankName" label="Bank Name" placeholder="Bank name" methods={methods} />
                  <FormField name="accountNumber" label="Account Number" placeholder="Account number" methods={methods} />
                  <FormField name="ifscCode" label="IFSC Code" placeholder="IFSC code" methods={methods} />
                  <ImageUpload label="Passbook Image" file={values.passbookImage} onChange={(file) => setFile("passbookImage", file)} error={errors.passbookImage?.message as string | undefined} />
                  <ImageUpload label="Cancelled Cheque" file={values.cancelledChequeImage} onChange={(file) => setFile("cancelledChequeImage", file)} error={errors.cancelledChequeImage?.message as string | undefined} />
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <PreviewSection
                    title="Personal Details"
                    items={[
                      ["Name", `${values.firstName} ${values.lastName}`.trim()],
                      ["Email", values.email],
                      ["Mobile", values.mobile],
                      ["Alternate Mobile", values.alternateMobileNumber],
                    ]}
                  />
                  <PreviewSection
                    title="Outlet Information"
                    items={[
                      ["Outlet", values.outletName],
                      ["Business Type", values.businessType],
                      ["GST", values.gstNumber],
                      ["Address", values.address],
                      ["City", [values.city, values.district, values.state].filter(Boolean).join(", ")],
                      ["Pincode", values.pincode],
                    ]}
                  />
                  <PreviewSection
                    title="KYC"
                    items={[
                      ["Aadhaar", values.aadhaarNumber],
                      ["PAN", values.panNumber],
                    ]}
                  />
                  <PreviewSection
                    title="Bank"
                    items={[
                      ["Account Holder", values.accountHolderName],
                      ["Bank", values.bankName],
                      ["Account Number", values.accountNumber],
                      ["IFSC", values.ifscCode],
                    ]}
                  />
                </div>
              )}

              <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={goBack} disabled={step === 1}>
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                {step < 5 ? (
                  <Button type="submit">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" isLoading={isAdminApiAuth && createUserLoading} disabled={isAdminApiAuth && createUserLoading}>
                    {submitLabel}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </form>
      </FormProvider>

      <SuccessModal
        open={successOpen}
        onOpenChange={(open) => {
          setSuccessOpen(open);
          if (!open) router.push(successRedirect);
        }}
        title={successTitle}
        message={successMessage}
      />
    </div>
  );
}
