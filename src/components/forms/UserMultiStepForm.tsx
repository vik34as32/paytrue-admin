"use client";
import { State, City } from "country-state-city";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/common/Select";
import {
  useForm,
  FormProvider,
  UseFormReturn,
  FieldValues,
  Path,
  Controller,
} from "react-hook-form";
import { toast } from "sonner";
import { ZodIssue } from "zod";
import { ChevronLeft, ChevronRight, Check, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { ImageUpload } from "@/components/common/ImageUpload";
import { VideoUpload } from "@/components/common/VideoUpload";
import { BankLogoGrid } from "@/components/common/BankLogoGrid";
import { ImagePreviewModal } from "@/components/common/ImagePreviewModal";
import { PasswordStrengthMeter } from "@/components/common/PasswordStrengthMeter";
import { generateSecurePassword } from "@/lib/generatePassword";
import {
  clearUserFormDraft,
  loadUserFormDraft,
  saveUserFormDraft,
} from "@/lib/userFormDraftStorage";
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

function PreviewImageCard({
  label,
  file,
}: {
  label: string;
  file: File | null;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!(file instanceof File)) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!previewUrl) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-background/40 p-4 text-center">
        <p className="text-xs font-semibold text-muted">{label}</p>
        <p className="mt-1 text-xs text-muted">Not uploaded</p>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={label}
            className="h-full w-full object-contain transition-transform group-hover:scale-[1.02]"
          />
        </div>
        <p className="border-t border-border px-3 py-2 text-xs font-semibold text-foreground">
          {label}
        </p>
      </button>
      <ImagePreviewModal
        open={open}
        onClose={() => setOpen(false)}
        src={previewUrl}
        title={label}
      />
    </>
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
  const draftReadyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        clearUserFormDraft(userType);
        reset(userFormEmptyDefaults);
        setValue("password", generateSecurePassword(), { shouldValidate: true });
        emailVerification.resetVerification();
        setStep(1);
        setMaxStepReached(1);
      } else {
        toast.error((result.payload as string) || "Failed to create user");
      }
      return;
    }

    toast.success(successToast || "Registration submitted (UI preview)");
    setSuccessOpen(true);
    clearUserFormDraft(userType);
    reset(userFormEmptyDefaults);
    setValue("password", generateSecurePassword(), { shouldValidate: true });
    emailVerification.resetVerification();
    setStep(1);
    setMaxStepReached(1);
  };
  const persistDraft = useCallback(() => {
    if (!draftReadyRef.current) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      void saveUserFormDraft(userType, {
        step,
        maxStepReached,
        values: getValues(),
      });
    }, 600);
  }, [getValues, maxStepReached, step, userType]);

  useEffect(() => {
    let active = true;

    void (async () => {
      const draft = await loadUserFormDraft(userType);
      if (!active) return;

      if (draft) {
        reset(draft.values);
        setStep(draft.step);
        setMaxStepReached(draft.maxStepReached);
      } else {
        setValue("password", generateSecurePassword(), { shouldValidate: true });
      }

      draftReadyRef.current = true;
    })();

    return () => {
      active = false;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [reset, setValue, userType]);

  useEffect(() => {
    const subscription = watch(() => {
      persistDraft();
    });

    return () => subscription.unsubscribe();
  }, [watch, persistDraft]);

  useEffect(() => {
    persistDraft();
  }, [step, maxStepReached, persistDraft]);

  const regeneratePassword = () => {
    const nextPassword = generateSecurePassword();
    setValue("password", nextPassword, { shouldValidate: true });
  };

  const copyPassword = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Password copied to clipboard");
    } catch {
      toast.error("Unable to copy password");
    }
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

        const matchedState = states.find(
          (state) =>
            state.name.toLowerCase() === String(postOffice.State).toLowerCase()
        );
        if (matchedState) {
          methods.setValue("state", matchedState.isoCode, {
            shouldValidate: true,
          });
        }
      }
    } catch (error) {
      console.error("Pincode lookup failed", error);
    }
  };

  fetchPincodeDetails();
}, [pincode, methods, states]);
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
                  <div className="space-y-2 lg:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Auto-generated Password
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <div className="relative min-w-[200px] flex-1">
                        <input
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          readOnly
                          value={password}
                          className="w-full rounded-xl border border-border bg-card py-2.5 pl-4 pr-11 font-mono text-sm text-foreground shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={regeneratePassword}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Regenerate
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void copyPassword()}
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                    {errors.password?.message ? (
                      <p className="text-xs text-accent-red">{errors.password.message}</p>
                    ) : null}
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
                  <Controller
                    name="aadhaarNumber"
                    control={methods.control}
                    render={({ field }) => (
                      <Input
                        label="Aadhaar Number"
                        placeholder="12-digit Aadhaar"
                        inputMode="numeric"
                        maxLength={12}
                        value={field.value}
                        error={errors.aadhaarNumber?.message}
                        onChange={(event) => {
                          const digits = event.target.value.replace(/\D/g, "").slice(0, 12);
                          field.onChange(digits);
                        }}
                      />
                    )}
                  />
                  <Controller
                    name="panNumber"
                    control={methods.control}
                    render={({ field }) => (
                      <Input
                        label="PAN Number"
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        value={field.value}
                        error={errors.panNumber?.message}
                        onChange={(event) => {
                          const normalized = event.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "")
                            .slice(0, 10);
                          field.onChange(normalized);
                        }}
                      />
                    )}
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
                      optional
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
                  <BankLogoGrid
                    value={values.bankName}
                    onChange={(bankName) => {
                      setValue("bankName", bankName, { shouldValidate: true });
                    }}
                    error={errors.bankName?.message as string | undefined}
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
                    optional
                    file={values.passbookImage}
                    onChange={(file) => setFile("passbookImage", file)}
                    error={errors.passbookImage?.message as string | undefined}
                  />
                  <ImageUpload
                    label="Cancelled Cheque"
                    optional
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
                        [
                          values.city,
                          values.district,
                          states.find((state) => state.isoCode === values.state)
                            ?.name || values.state,
                        ]
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
                      [
                        "Video Verification",
                        values.videoVerification?.name || "Not provided",
                      ],
                    ]}
                  />
                  <div className="rounded-xl border border-border bg-background/60 p-4">
                    <h4 className="mb-3 text-sm font-bold text-foreground">
                      Uploaded Documents
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <PreviewImageCard
                        label="Profile Image"
                        file={values.profileImage}
                      />
                      <PreviewImageCard
                        label="Aadhaar Front"
                        file={values.aadhaarFront}
                      />
                      <PreviewImageCard
                        label="Aadhaar Back"
                        file={values.aadhaarBack}
                      />
                      <PreviewImageCard label="PAN Card" file={values.panCard} />
                      <PreviewImageCard
                        label="Owner Photo"
                        file={values.ownerPhoto}
                      />
                      <PreviewImageCard
                        label="Passbook"
                        file={values.passbookImage}
                      />
                      <PreviewImageCard
                        label="Cancelled Cheque"
                        file={values.cancelledChequeImage}
                      />
                    </div>
                  </div>
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
