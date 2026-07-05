"use client";
import { State, City } from "country-state-city";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/common/Select";
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
import { EmailVerificationField } from "@/components/common/EmailVerificationField";
import {
  EMAIL_VERIFICATION_REQUIRED_MESSAGE,
  USER_CREATED_SUCCESS_MESSAGE,
  useEmailVerification,
} from "@/hooks/useEmailVerification";
import { registerUser } from "@/store/api/adminModuleApi";

function FormField<T extends FieldValues>({
  name,
  label,
  type = "text",
  placeholder,
  methods,
  disabled = false,
}: {
  name: Path<T>;
  label: string;
  type?: string;
  placeholder?: string;
  methods: UseFormReturn<T>;
  disabled?: boolean;
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
      disabled={disabled}
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
            <p className="text-sm font-medium text-foreground">
              {value || "—"}
            </p>
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
  requireEmailVerification?: boolean;
}

export function UserMultiStepForm({
  userType,
  submitLabel,
  successTitle,
  successMessage,
  successRedirect,
  successToast,
  requireEmailVerification = false,
}: UserMultiStepFormProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAdminApiAuth } = useRoleAccess();
  const { createUserLoading } = useAppSelector((state) => state.adminModule);

  const [step, setStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
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
  const email = watch("email") || "";
  const values = watch();
  const selectedState = methods.watch("state");
  const states = State.getStatesOfCountry("IN");
  const pincode = methods.watch("pincode");

  const cities = selectedState
    ? City.getCitiesOfState("IN", selectedState)
    : [];
  const emailVerification = useEmailVerification(email);
  const needsEmailVerification = requireEmailVerification;

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

    if (step === 1 && needsEmailVerification && !emailVerification.isVerified) {
      toast.error(EMAIL_VERIFICATION_REQUIRED_MESSAGE);
      return;
    }

    setStep((current) => {
  const nextStep = Math.min(current + 1, USER_FORM_STEPS.length);

  setMaxStepReached((prev) => Math.max(prev, nextStep));

  return nextStep;
});
  };

  const goBack = () => setStep((current) => Math.max(current - 1, 1));

  const onSubmit = async () => {
    const data = getValues();

    if (needsEmailVerification && !emailVerification.isVerified) {
      toast.error(EMAIL_VERIFICATION_REQUIRED_MESSAGE);
      return;
    }

    if (isAdminApiAuth) {
      const result = await dispatch(registerUser({ data, userType }));
      if (registerUser.fulfilled.match(result)) {
        toast.success(
          needsEmailVerification
            ? USER_CREATED_SUCCESS_MESSAGE
            : successToast || "User created successfully",
        );
        setSuccessOpen(true);
        reset(userFormEmptyDefaults);
        emailVerification.resetVerification();
        setStep(1);
      } else {
        toast.error((result.payload as string) || "Failed to create user");
      }
      return;
    }

    toast.success(successToast || "Registration submitted (UI preview)");
    setSuccessOpen(true);
    reset(userFormEmptyDefaults);
    emailVerification.resetVerification();
    setStep(1);
  };
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        methods.setValue("latitude", position.coords.latitude.toString());

        methods.setValue("longitude", position.coords.longitude.toString());
      },
      (error) => {
        console.error("Location error:", error);
      },
    );
  }, [methods]);
  useEffect(() => {
  if (pincode?.length !== 6) return;

  const fetchPincodeDetails = async () => {
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      );

      const data = await response.json();

      if (
        data[0]?.Status === "Success" &&
        data[0]?.PostOffice?.length > 0
      ) {
        const postOffice = data[0].PostOffice[0];

        methods.setValue("district", postOffice.District, {
          shouldValidate: true,
        });

        methods.setValue("city", postOffice.Block || postOffice.Name, {
          shouldValidate: true,
        });
      }
    } catch (error) {
      console.error("Pincode lookup failed", error);
    }
  };

  fetchPincodeDetails();
}, [pincode, methods]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {USER_FORM_STEPS.map((formStep) => (
          <button
            key={formStep.id}
            type="button"
            onClick={() => setStep(formStep.id)}
           disabled={formStep.id > maxStepReached}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              step === formStep.id
                ? "bg-primary text-primary-foreground"
                : step > formStep.id
                  ? "bg-accent-green/10 text-accent-green hover:bg-accent-green/20"
                  : "bg-background text-muted hover:bg-primary/10 hover:text-primary"
            }`}
          >
            {step > formStep.id ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              formStep.id
            )}
            <span className="hidden sm:inline">{formStep.title}</span>
          </button>
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
                  <FormField
                    name="firstName"
                    label="First Name"
                    placeholder="Enter first name"
                    methods={methods}
                  />
                  <FormField
                    name="lastName"
                    label="Last Name"
                    placeholder="Enter last name"
                    methods={methods}
                  />
                  {needsEmailVerification ? (
                    <EmailVerificationField
                      email={email}
                      onEmailChange={(value) =>
                        setValue("email", value, { shouldValidate: true })
                      }
                      verification={emailVerification}
                      label="Email"
                      placeholder="Enter email"
                      error={errors.email?.message}
                    />
                  ) : (
                    <FormField
                      name="email"
                      label="Email"
                      type="email"
                      placeholder="Enter email"
                      methods={methods}
                    />
                  )}
                  <FormField
                    name="mobile"
                    label="Mobile"
                    placeholder="10-digit mobile"
                    methods={methods}
                  />
                  <FormField
                    name="alternateMobileNumber"
                    label="Alternate Mobile"
                    placeholder="Optional"
                    methods={methods}
                  />
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
                  <FormField
                    name="outletName"
                    label="Outlet Name"
                    placeholder="Enter outlet name"
                    methods={methods}
                  />
                  <Select
                    label="Business Type"
                    value={values.businessType}
                    onChange={(e) =>
                      methods.setValue("businessType", e.target.value, {
                        shouldValidate: true,
                      })
                    }
                    error={errors.businessType?.message as string | undefined}
                    options={[
                      { value: "", label: "Select Business Type " },
                      { value: "INDIVIDUAL", label: "Individual" },
                      { value: "PARTNERSHIP", label: "Partnership" },
                      { value: "PRIVATE_LIMITED", label: "Private Limited" },
                      { value: "PROPRIETORSHIP", label: "Proprietorship" },
                      { value: "OTHER", label: "Other" },
                      { value: "SALE", label: "Sale" },
                    ]}
                  />
                  <FormField
                    name="gstNumber"
                    label="GST Number"
                    placeholder="Optional"
                    methods={methods}
                  />
                  <FormField
                    name="address"
                    label="Address"
                    placeholder="Full address"
                    methods={methods}
                  />
                  <Select
                    label="State"
                    value={selectedState}
                    onChange={(e) => {
                      methods.setValue("state", e.target.value, {
                        shouldValidate: true,
                      });

                      methods.setValue("city", "");
                      methods.setValue("district", "");
                    }}
                    error={errors.state?.message as string | undefined}
                    options={[
                      { value: "", label: "Select State" },
                      ...states.map((state) => ({
                        value: state.isoCode,
                        label: state.name,
                      })),
                    ]}
                  />
                  <FormField
  name="district"
  label="District"
  placeholder="District"
  methods={methods}
  disabled
/>
                  <Select
                    label="City"
                    value={values.city}
                    onChange={(e) =>
                      methods.setValue("city", e.target.value, {
                        shouldValidate: true,
                      })
                    }
                    disabled={!selectedState}
                    error={errors.city?.message as string | undefined}
                    options={[
                      { value: "", label: "Select City" },
                      ...cities.map((city) => ({
                        value: city.name,
                        label: city.name,
                      })),
                    ]}
                  />
                  <FormField
                    name="village"
                    label="Village"
                    placeholder="Optional"
                    methods={methods}
                  />
                  <FormField
                    name="pincode"
                    label="Pincode"
                    placeholder="6-digit pincode"
                    methods={methods}
                  />
                  <FormField
                    name="latitude"
                    label="Latitude"
                    placeholder="Fetching..."
                    methods={methods}
                    disabled
                  />
                  <FormField
                    name="longitude"
                    label="Longitude"
                    placeholder="Optional"
                    methods={methods}
                    disabled
                  />
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <FormField
                    name="aadhaarNumber"
                    label="Aadhaar Number"
                    placeholder="12-digit Aadhaar"
                    methods={methods}
                  />
                  <FormField
                    name="panNumber"
                    label="PAN Number"
                    placeholder="PAN number"
                    methods={methods}
                  />
                  <ImageUpload
                    label="Aadhaar Front"
                    file={values.aadhaarFront}
                    onChange={(file) => setFile("aadhaarFront", file)}
                    error={errors.aadhaarFront?.message as string | undefined}
                  />
                  <ImageUpload
                    label="Aadhaar Back"
                    file={values.aadhaarBack}
                    onChange={(file) => setFile("aadhaarBack", file)}
                    error={errors.aadhaarBack?.message as string | undefined}
                  />
                  <ImageUpload
                    label="PAN Card"
                    file={values.panCard}
                    onChange={(file) => setFile("panCard", file)}
                    error={errors.panCard?.message as string | undefined}
                  />
                  <ImageUpload
                    label="Owner Photo"
                    file={values.ownerPhoto}
                    onChange={(file) => setFile("ownerPhoto", file)}
                    error={errors.ownerPhoto?.message as string | undefined}
                  />
                  <div className="lg:col-span-2">
                    <VideoUpload
                      label="Video Verification"
                      file={values.videoVerification}
                      onChange={(file) => setFile("videoVerification", file)}
                      error={
                        errors.videoVerification?.message as string | undefined
                      }
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <FormField
                    name="accountHolderName"
                    label="Account Holder Name"
                    placeholder="As per bank"
                    methods={methods}
                  />
                  <FormField
                    name="bankName"
                    label="Bank Name"
                    placeholder="Bank name"
                    methods={methods}
                  />
                  <FormField
                    name="accountNumber"
                    label="Account Number"
                    placeholder="Account number"
                    methods={methods}
                  />
                  <FormField
                    name="ifscCode"
                    label="IFSC Code"
                    placeholder="IFSC code"
                    methods={methods}
                  />
                  <ImageUpload
                    label="Passbook Image"
                    file={values.passbookImage}
                    onChange={(file) => setFile("passbookImage", file)}
                    error={errors.passbookImage?.message as string | undefined}
                  />
                  <ImageUpload
                    label="Cancelled Cheque"
                    file={values.cancelledChequeImage}
                    onChange={(file) => setFile("cancelledChequeImage", file)}
                    error={
                      errors.cancelledChequeImage?.message as string | undefined
                    }
                  />
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
                      [
                        "City",
                        [values.city, values.district, values.state]
                          .filter(Boolean)
                          .join(", "),
                      ],
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={step === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                {step < 5 ? (
                  <Button type="submit">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    isLoading={isAdminApiAuth && createUserLoading}
                    disabled={
                      (isAdminApiAuth && createUserLoading) ||
                      (needsEmailVerification && !emailVerification.isVerified)
                    }
                  >
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
