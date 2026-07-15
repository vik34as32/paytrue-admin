"use client";

import { useEffect, useMemo, useState } from "react";
import { State, City } from "country-state-city";
import {
  useForm,
  FormProvider,
  UseFormReturn,
  FieldValues,
  Path,
  Controller,
} from "react-hook-form";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "@/components/modals/Modal";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { Select } from "@/components/common/Select";
import { ImageUpload } from "@/components/common/ImageUpload";
import { BankLogoGrid } from "@/components/common/BankLogoGrid";
import { ImagePreviewModal } from "@/components/common/ImagePreviewModal";
import {
  USER_FORM_STEPS,
  userFormEmptyDefaults,
  UserFormValues,
} from "@/validations/userStepSchemas";
import {
  mapApiUserToExistingUrls,
  mapApiUserToExtraMediaUrls,
  mapApiUserToFormValues,
} from "@/lib/buildUserFormData";
import { formatUserTypeLabel, getNetworkUserName } from "@/lib/normalizeUser";
import { resolveMediaUrl } from "@/lib/utils";
import { UserDetailRecord } from "@/types/superAdmin";
import { AdminUserUpdatePayload } from "@/services/adminUsersApi";
import { USER_FILE_FIELDS, UserFileFieldKey } from "@/constants/uploadConfig";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "PENDING", label: "Pending" },
];

const BUSINESS_TYPE_OPTIONS = [
  { value: "", label: "Select Business Type " },
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "PRIVATE_LIMITED", label: "Private Limited" },
  { value: "PROPRIETORSHIP", label: "Proprietorship" },
  { value: "OTHER", label: "Other" },
  { value: "SALE", label: "Sale" },
];

function toStateIso(state?: string): string {
  if (!state) return "";
  const states = State.getStatesOfCountry("IN");
  const byCode = states.find((s) => s.isoCode === state);
  if (byCode) return byCode.isoCode;
  const byName = states.find(
    (s) => s.name.toLowerCase() === state.toLowerCase()
  );
  return byName?.isoCode || state;
}

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
  src,
}: {
  label: string;
  src?: string | null;
}) {
  const [open, setOpen] = useState(false);

  if (!src) {
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
            src={src}
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
        src={src}
        title={label}
      />
    </>
  );
}

export interface AdminUserStepModalProps {
  mode: "view" | "edit";
  isOpen: boolean;
  onClose: () => void;
  user: UserDetailRecord | null;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onSubmit?: (payload: AdminUserUpdatePayload) => Promise<boolean>;
}

export function AdminUserStepModal({
  mode,
  isOpen,
  onClose,
  user,
  isLoading = false,
  isSubmitting = false,
  onSubmit,
}: AdminUserStepModalProps) {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<
    "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING"
  >("ACTIVE");
  const isEdit = mode === "edit";
  const isView = mode === "view";
  // View: everything read-only. Edit: only personal fields (API PATCH limit).
  const lockSteps = isView || isEdit;

  const methods = useForm<UserFormValues>({
    defaultValues: userFormEmptyDefaults,
    mode: "onBlur",
  });

  const { watch, reset, getValues, handleSubmit, formState } = methods;
  const values = watch();
  const selectedState = watch("state");
  const states = useMemo(() => State.getStatesOfCountry("IN"), []);
  const cities = selectedState
    ? City.getCitiesOfState("IN", selectedState)
    : [];

  const mediaUrls = useMemo(() => {
    if (!user) return {} as Partial<Record<UserFileFieldKey, string | null>>;
    const urls = mapApiUserToExistingUrls(user);
    const extra = mapApiUserToExtraMediaUrls(user);
    const resolved: Partial<Record<UserFileFieldKey, string | null>> & {
      outletImage?: string | null;
    } = {};
    (Object.keys(USER_FILE_FIELDS) as UserFileFieldKey[]).forEach((key) => {
      resolved[key] = resolveMediaUrl(urls[key] || null);
    });
    resolved.outletImage = resolveMediaUrl(extra.outletImage);
    return resolved;
  }, [user]);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      return;
    }
    setStep(1);
    if (!user) return;

    const mapped = mapApiUserToFormValues(user);
    reset({
      ...userFormEmptyDefaults,
      ...mapped,
      state: toStateIso(mapped.state),
      password: "",
    });
    const nextStatus = String(user.status || "ACTIVE").toUpperCase();
    setStatus(
      (["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"].includes(nextStatus)
        ? nextStatus
        : "ACTIVE") as "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING"
    );
  }, [isOpen, user, reset]);

  const goNext = () =>
    setStep((current) => Math.min(current + 1, USER_FORM_STEPS.length));
  const goBack = () => setStep((current) => Math.max(current - 1, 1));

  const saveEdit = handleSubmit(async () => {
    if (!onSubmit || !isEdit) return;
    const data = getValues();
    const name = [data.firstName, data.lastName]
      .filter((part) => Boolean(part?.trim()))
      .map((part) => part.trim())
      .join(" ");
    const ok = await onSubmit({
      firstName: data.firstName.trim(),
      lastName: data.lastName?.trim() || null,
      name,
      email: data.email.trim(),
      phone: data.mobile.trim(),
      mobile: data.mobile.trim(),
      status,
    });
    if (ok) onClose();
  });

  const noopFile = (_file: File | null) => {
    // View/edit media is read-only
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit User" : "View User"}
      subtitle={
        user
          ? `${getNetworkUserName(user)} · ${formatUserTypeLabel(
              user.userType || user.role
            )}`
          : "Multi-step profile"
      }
      size="2xl"
    >
      {isLoading || !user ? (
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {USER_FORM_STEPS.map((formStep) => (
              <button
                key={formStep.id}
                type="button"
                onClick={() => setStep(formStep.id)}
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
            <Card>
              <CardHeader
                title={USER_FORM_STEPS[step - 1].title}
                subtitle={`Step ${step} of ${USER_FORM_STEPS.length}${
                  isView
                    ? " · View only"
                    : " · Password not shown in edit mode"
                }`}
              />

              <div className="space-y-6">
                {step === 1 && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <FormField
                      name="firstName"
                      label="First Name"
                      placeholder="Enter first name"
                      methods={methods}
                      disabled={!isEdit}
                    />
                    <FormField
                      name="lastName"
                      label="Last Name"
                      placeholder="Enter last name"
                      methods={methods}
                      disabled={!isEdit}
                    />
                    <FormField
                      name="email"
                      label="Email"
                      type="email"
                      placeholder="Enter email"
                      methods={methods}
                      disabled={!isEdit}
                    />
                    <FormField
                      name="alternateMobileNumber"
                      label="Alternate Mobile"
                      placeholder="Optional"
                      methods={methods}
                      disabled={!isEdit}
                    />
                    <FormField
                      name="mobile"
                      label="Mobile"
                      placeholder="10-digit mobile"
                      methods={methods}
                      disabled={!isEdit}
                    />
                    {isEdit ? (
                      <Select
                        label="Status"
                        value={status}
                        onChange={(e) =>
                          setStatus(
                            e.target.value as
                              | "ACTIVE"
                              | "INACTIVE"
                              | "SUSPENDED"
                              | "PENDING"
                          )
                        }
                        options={STATUS_OPTIONS}
                      />
                    ) : (
                      <Input
                        label="Status"
                        value={user.status || "—"}
                        disabled
                        readOnly
                      />
                    )}
                    <div className="lg:col-span-2">
                      <ImageUpload
                        label="Profile Image"
                        file={null}
                        existingUrl={mediaUrls.profileImage}
                        onChange={noopFile}
                        readOnly
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
                      disabled={lockSteps}
                    />
                    <Select
                      label="Business Type"
                      value={values.businessType || ""}
                      disabled={lockSteps}
                      onChange={(e) =>
                        methods.setValue("businessType", e.target.value)
                      }
                      options={BUSINESS_TYPE_OPTIONS}
                    />
                    <FormField
                      name="gstNumber"
                      label="GST Number"
                      placeholder="Optional"
                      methods={methods}
                      disabled={lockSteps}
                    />
                    <FormField
                      name="address"
                      label="Address"
                      placeholder="Full address"
                      methods={methods}
                      disabled={lockSteps}
                    />
                    <Select
                      label="State"
                      value={selectedState}
                      disabled={lockSteps}
                      onChange={(e) =>
                        methods.setValue("state", e.target.value)
                      }
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
                      disabled={lockSteps || !selectedState}
                      onChange={(e) =>
                        methods.setValue("city", e.target.value)
                      }
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
                      disabled={lockSteps}
                    />
                    <FormField
                      name="pincode"
                      label="Pincode"
                      placeholder="6-digit pincode"
                      methods={methods}
                      disabled={lockSteps}
                    />
                    <FormField
                      name="latitude"
                      label="Latitude"
                      placeholder="—"
                      methods={methods}
                      disabled
                    />
                    <FormField
                      name="longitude"
                      label="Longitude"
                      placeholder="—"
                      methods={methods}
                      disabled
                    />
                    {(mediaUrls as { outletImage?: string | null }).outletImage ? (
                      <div className="lg:col-span-2">
                        <ImageUpload
                          label="Outlet / Shop Image"
                          file={null}
                          existingUrl={
                            (mediaUrls as { outletImage?: string | null })
                              .outletImage
                          }
                          onChange={noopFile}
                          readOnly
                        />
                      </div>
                    ) : null}
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
                          disabled={lockSteps}
                          error={formState.errors.aadhaarNumber?.message}
                          onChange={(event) => {
                            const digits = event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 12);
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
                          disabled={lockSteps}
                          error={formState.errors.panNumber?.message}
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
                      file={null}
                      existingUrl={mediaUrls.aadhaarFront}
                      onChange={noopFile}
                      readOnly
                    />
                    <ImageUpload
                      label="Aadhaar Back"
                      file={null}
                      existingUrl={mediaUrls.aadhaarBack}
                      onChange={noopFile}
                      readOnly
                    />
                    <ImageUpload
                      label="PAN Card"
                      file={null}
                      existingUrl={mediaUrls.panCard}
                      onChange={noopFile}
                      readOnly
                    />
                    <ImageUpload
                      label="Owner Photo"
                      file={null}
                      existingUrl={mediaUrls.ownerPhoto}
                      onChange={noopFile}
                      readOnly
                    />
                    {mediaUrls.videoVerification ? (
                      <div className="lg:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-foreground">
                          Video Verification
                        </label>
                        <video
                          src={mediaUrls.videoVerification}
                          controls
                          className="max-h-64 w-full rounded-xl border border-border bg-black"
                        />
                      </div>
                    ) : (
                      <div className="lg:col-span-2 rounded-xl border border-dashed border-border bg-background/40 p-4 text-sm text-muted">
                        Video Verification — Not provided
                      </div>
                    )}
                  </div>
                )}

                {step === 4 && (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <FormField
                      name="accountHolderName"
                      label="Account Holder Name"
                      placeholder="As per bank"
                      methods={methods}
                      disabled={lockSteps}
                    />
                    <div className="space-y-2">
                      <BankLogoGrid
                        value={values.bankName || ""}
                        onChange={(bankName) => {
                          if (!lockSteps) {
                            methods.setValue("bankName", bankName);
                          }
                        }}
                      />
                      {lockSteps && values.bankName ? (
                        <p className="text-xs text-muted">
                          Selected bank: {values.bankName}
                        </p>
                      ) : null}
                    </div>
                    <FormField
                      name="accountNumber"
                      label="Account Number"
                      placeholder="Account number"
                      methods={methods}
                      disabled={lockSteps}
                    />
                    <FormField
                      name="ifscCode"
                      label="IFSC Code"
                      placeholder="IFSC code"
                      methods={methods}
                      disabled={lockSteps}
                    />
                    <ImageUpload
                      label="Passbook Image"
                      optional
                      file={null}
                      existingUrl={mediaUrls.passbookImage}
                      onChange={noopFile}
                      readOnly
                    />
                    <ImageUpload
                      label="Cancelled Cheque"
                      optional
                      file={null}
                      existingUrl={mediaUrls.cancelledChequeImage}
                      onChange={noopFile}
                      readOnly
                    />
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-4">
                    <PreviewSection
                      title="Personal Details"
                      items={[
                        [
                          "Name",
                          `${values.firstName} ${values.lastName}`.trim(),
                        ],
                        ["Email", values.email],
                        ["Mobile", values.mobile],
                        ["Alternate Mobile", values.alternateMobileNumber],
                        ["Status", isEdit ? status : user.status],
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
                            states.find((s) => s.isoCode === values.state)
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
                          mediaUrls.videoVerification
                            ? "Uploaded"
                            : "Not provided",
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
                          src={mediaUrls.profileImage}
                        />
                        <PreviewImageCard
                          label="Aadhaar Front"
                          src={mediaUrls.aadhaarFront}
                        />
                        <PreviewImageCard
                          label="Aadhaar Back"
                          src={mediaUrls.aadhaarBack}
                        />
                        <PreviewImageCard
                          label="PAN Card"
                          src={mediaUrls.panCard}
                        />
                        <PreviewImageCard
                          label="Owner Photo"
                          src={mediaUrls.ownerPhoto}
                        />
                        <PreviewImageCard
                          label="Outlet Image"
                          src={
                            (mediaUrls as { outletImage?: string | null })
                              .outletImage
                          }
                        />
                        <PreviewImageCard
                          label="Passbook"
                          src={mediaUrls.passbookImage}
                        />
                        <PreviewImageCard
                          label="Cancelled Cheque"
                          src={mediaUrls.cancelledChequeImage}
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
                    disabled={step === 1 || isSubmitting}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Close
                    </Button>
                    {step < 5 ? (
                      <Button
                        type="button"
                        onClick={goNext}
                        disabled={isSubmitting}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : isEdit ? (
                      <Button
                        type="button"
                        onClick={() => void saveEdit()}
                        isLoading={isSubmitting}
                      >
                        Save Changes
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          </FormProvider>
        </div>
      )}
    </Modal>
  );
}
