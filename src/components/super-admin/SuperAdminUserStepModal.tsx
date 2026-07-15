"use client";

import { useEffect, useMemo, useState } from "react";
import { State, City } from "country-state-city";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
} from "lucide-react";
import { Modal } from "@/components/modals/Modal";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { Select } from "@/components/common/Select";
import { ImageUpload } from "@/components/common/ImageUpload";
import { ImagePreviewModal } from "@/components/common/ImagePreviewModal";
import { BankLogoGrid } from "@/components/common/BankLogoGrid";
import {
  mapApiUserToExistingUrls,
  mapApiUserToExtraMediaUrls,
} from "@/lib/buildUserFormData";
import { formatUserTypeLabel, getNetworkUserName } from "@/lib/normalizeUser";
import { resolveMediaUrl } from "@/lib/utils";
import { UserDetailRecord } from "@/types/superAdmin";
import {
  mapUserDetailToEditValues,
  SUPER_ADMIN_BUSINESS_TYPE_OPTIONS,
} from "@/services/userApi";
import {
  networkUserEditSchema,
  NetworkUserEditValues,
  networkUserEditEmptyDefaults,
} from "@/validations/networkUserSchemas";
import { USER_FILE_FIELDS, UserFileFieldKey } from "@/constants/uploadConfig";

const STEPS = [
  { id: 1, title: "Basic Details" },
  { id: 2, title: "Personal Details" },
  { id: 3, title: "Address" },
  { id: 4, title: "Bank" },
  { id: 5, title: "Documents" },
] as const;

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "PENDING", label: "Pending" },
];

const GENDER_OPTIONS = [
  { value: "", label: "Select Gender" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
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

function isPdfUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.pdf(\?|$)/i.test(url) || url.toLowerCase().includes("application/pdf");
}

function DocumentCard({
  label,
  url,
  mode,
}: {
  label: string;
  url?: string | null;
  mode: "view" | "edit";
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const resolved = url || null;
  const pdf = isPdfUrl(resolved);

  if (!resolved) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-background/40 p-4 text-center">
        <p className="text-xs font-semibold text-muted">{label}</p>
        <p className="mt-1 text-xs text-muted">Not uploaded</p>
      </div>
    );
  }

  if (pdf) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 bg-background/60">
          <FileText className="h-10 w-10 text-primary" />
          <p className="text-xs font-semibold text-foreground">{label}</p>
          <p className="text-[10px] text-muted">PDF document</p>
        </div>
        <div className="flex items-center justify-end gap-1 border-t border-border px-3 py-2">
          <a
            href={resolved}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View
          </a>
          <a
            href={resolved}
            download
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-background"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <ImageUpload
        label={label}
        file={null}
        existingUrl={resolved}
        onChange={() => undefined}
        readOnly={mode === "view"}
      />
      <div className="mt-1 flex justify-end gap-1">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View
        </button>
        <a
          href={resolved}
          download
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-background"
        >
          <Download className="h-3.5 w-3.5" /> Download
        </a>
      </div>
      <ImagePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        src={resolved}
        title={label}
      />
    </>
  );
}

export interface SuperAdminUserStepModalProps {
  mode: "view" | "edit";
  isOpen: boolean;
  onClose: () => void;
  user: UserDetailRecord | null;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onSubmit?: (values: NetworkUserEditValues) => Promise<boolean>;
}

export function SuperAdminUserStepModal({
  mode,
  isOpen,
  onClose,
  user,
  isLoading = false,
  isSubmitting = false,
  onSubmit,
}: SuperAdminUserStepModalProps) {
  const [step, setStep] = useState(1);
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const isEdit = mode === "edit";
  const isView = mode === "view";

  const methods = useForm<NetworkUserEditValues>({
    resolver: zodResolver(networkUserEditSchema),
    defaultValues: networkUserEditEmptyDefaults,
    mode: "onBlur",
  });

  const { reset, watch, handleSubmit, setValue, formState, control, register } =
    methods;
  const values = watch();
  const selectedState = watch("state");
  const states = useMemo(() => State.getStatesOfCountry("IN"), []);
  const cities = selectedState
    ? City.getCitiesOfState("IN", selectedState)
    : [];

  const mediaUrls = useMemo(() => {
    if (!user) {
      return {} as Partial<Record<UserFileFieldKey, string | null>> & {
        outletImage?: string | null;
        gstCertificate?: string | null;
      };
    }
    const urls = mapApiUserToExistingUrls(user);
    const extra = mapApiUserToExtraMediaUrls(user);
    const resolved: Partial<Record<UserFileFieldKey, string | null>> & {
      outletImage?: string | null;
      gstCertificate?: string | null;
    } = {};
    (Object.keys(USER_FILE_FIELDS) as UserFileFieldKey[]).forEach((key) => {
      resolved[key] = resolveMediaUrl(urls[key] || null);
    });
    resolved.outletImage = resolveMediaUrl(extra.outletImage);
    const gst =
      (user as Record<string, unknown>).gstCertificateUrl ||
      (user as Record<string, unknown>).gstCertificate ||
      (user.outlet as Record<string, unknown> | undefined)?.gstCertificate ||
      (user.kyc as Record<string, unknown> | undefined)?.gstCertificateUrl;
    resolved.gstCertificate = resolveMediaUrl(
      typeof gst === "string" ? gst : null
    );
    return resolved;
  }, [user]);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      return;
    }
    setStep(1);
    if (!user) return;
    const mapped = mapUserDetailToEditValues(user);
    reset({
      ...networkUserEditEmptyDefaults,
      ...mapped,
      state: toStateIso(mapped.state),
      password: "",
    });
    const raw = user as Record<string, unknown>;
    setDob(
      String(
        raw.dateOfBirth ||
          raw.dob ||
          user.profile?.dateOfBirth ||
          ""
      )
    );
    setGender(String(raw.gender || user.profile?.gender || "").toUpperCase());
  }, [isOpen, user, reset]);

  const goNext = () => setStep((s) => Math.min(STEPS.length, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const save = handleSubmit(async (data) => {
    if (!onSubmit || !isEdit) return;
    const ok = await onSubmit({ ...data, password: "" });
    if (ok) onClose();
  });

  const lockNonBasic = isView;

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
            {STEPS.map((formStep) => (
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
                title={STEPS[step - 1].title}
                subtitle={`Step ${step} of ${STEPS.length}${
                  isView ? " · View only" : " · Prefill from API"
                }`}
              />

              <div className="space-y-6">
                {step === 1 && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Input
                      label="First Name"
                      disabled={isView}
                      error={formState.errors.firstName?.message}
                      {...register("firstName")}
                    />
                    <Input
                      label="Last Name"
                      disabled={isView}
                      error={formState.errors.lastName?.message}
                      {...register("lastName")}
                    />
                    <Input
                      label="Business Name"
                      disabled={isView}
                      error={formState.errors.outletName?.message}
                      {...register("outletName")}
                    />
                    <Input
                      label="Email"
                      type="email"
                      disabled={isView}
                      error={formState.errors.email?.message}
                      {...register("email")}
                    />
                    <Input
                      label="Mobile"
                      disabled={isView}
                      error={formState.errors.mobile?.message}
                      {...register("mobile")}
                    />
                    <Input
                      label="Alternate Mobile"
                      disabled={isView}
                      {...register("alternateMobileNumber")}
                    />
                    <Select
                      label="Status"
                      disabled={isView}
                      value={values.status || ""}
                      onChange={(e) =>
                        setValue(
                          "status",
                          e.target.value as NetworkUserEditValues["status"]
                        )
                      }
                      options={STATUS_OPTIONS}
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Controller
                      name="aadhaarNumber"
                      control={control}
                      render={({ field }) => (
                        <Input
                          label="Aadhaar Number"
                          placeholder="12-digit Aadhaar"
                          inputMode="numeric"
                          maxLength={12}
                          disabled={isView}
                          value={field.value || ""}
                          error={formState.errors.aadhaarNumber?.message}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value.replace(/\D/g, "").slice(0, 12)
                            )
                          }
                        />
                      )}
                    />
                    <Controller
                      name="panNumber"
                      control={control}
                      render={({ field }) => (
                        <Input
                          label="PAN Number"
                          placeholder="ABCDE1234F"
                          maxLength={10}
                          disabled={isView}
                          value={field.value || ""}
                          error={formState.errors.panNumber?.message}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                .toUpperCase()
                                .replace(/[^A-Z0-9]/g, "")
                                .slice(0, 10)
                            )
                          }
                        />
                      )}
                    />
                    <Input
                      label="Date of Birth"
                      type="date"
                      disabled={isView}
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                    <Select
                      label="Gender"
                      disabled={isView}
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      options={GENDER_OPTIONS}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="lg:col-span-2">
                      <Input
                        label="Address"
                        disabled={lockNonBasic && !isEdit ? true : isView}
                        error={formState.errors.address?.message}
                        {...register("address")}
                      />
                    </div>
                    <Select
                      label="State"
                      disabled={isView}
                      value={selectedState}
                      onChange={(e) => {
                        setValue("state", e.target.value, {
                          shouldValidate: true,
                        });
                        setValue("city", "");
                      }}
                      error={formState.errors.state?.message}
                      options={[
                        { value: "", label: "Select State" },
                        ...states.map((s) => ({
                          value: s.isoCode,
                          label: s.name,
                        })),
                      ]}
                    />
                    <Input
                      label="District"
                      disabled={isView}
                      {...register("district")}
                    />
                    <Select
                      label="City"
                      disabled={isView || !selectedState}
                      value={values.city}
                      onChange={(e) =>
                        setValue("city", e.target.value, {
                          shouldValidate: true,
                        })
                      }
                      error={formState.errors.city?.message}
                      options={[
                        { value: "", label: "Select City" },
                        ...cities.map((c) => ({
                          value: c.name,
                          label: c.name,
                        })),
                      ]}
                    />
                    <Input
                      label="Pincode"
                      disabled={isView}
                      {...register("pincode")}
                    />
                    <Input
                      label="Village"
                      disabled={isView}
                      {...register("village")}
                    />
                    <Select
                      label="Business Type"
                      disabled={isView}
                      value={values.businessType || ""}
                      onChange={(e) =>
                        setValue(
                          "businessType",
                          e.target
                            .value as NetworkUserEditValues["businessType"]
                        )
                      }
                      options={SUPER_ADMIN_BUSINESS_TYPE_OPTIONS}
                    />
                    <Input
                      label="GST Number"
                      disabled={isView}
                      {...register("gstNumber")}
                    />
                  </div>
                )}

                {step === 4 && (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <BankLogoGrid
                      value={values.bankName || ""}
                      onChange={(bankName) => {
                        if (!isView) setValue("bankName", bankName);
                      }}
                    />
                    <Input
                      label="Account Holder Name"
                      disabled={isView}
                      {...register("accountHolderName")}
                    />
                    <Input
                      label="Account Number"
                      disabled={isView}
                      {...register("accountNumber")}
                    />
                    <Input
                      label="IFSC"
                      disabled={isView}
                      {...register("ifscCode")}
                    />
                    <Input
                      label="Branch"
                      disabled={isView}
                      value={
                        ((user.bankAccount as Record<string, unknown> | undefined)
                          ?.branchName as string | undefined) ||
                        ((user.bankAccount as Record<string, unknown> | undefined)
                          ?.branch as string | undefined) ||
                        ""
                      }
                      readOnly
                    />
                  </div>
                )}

                {step === 5 && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <DocumentCard
                      label="Profile Photo"
                      url={mediaUrls.profileImage}
                      mode={mode}
                    />
                    <DocumentCard
                      label="Aadhaar Front"
                      url={mediaUrls.aadhaarFront}
                      mode={mode}
                    />
                    <DocumentCard
                      label="Aadhaar Back"
                      url={mediaUrls.aadhaarBack}
                      mode={mode}
                    />
                    <DocumentCard
                      label="PAN Card"
                      url={mediaUrls.panCard}
                      mode={mode}
                    />
                    <DocumentCard
                      label="Owner / Profile Photo"
                      url={mediaUrls.ownerPhoto}
                      mode={mode}
                    />
                    <DocumentCard
                      label="Cancelled Cheque"
                      url={mediaUrls.cancelledChequeImage}
                      mode={mode}
                    />
                    <DocumentCard
                      label="GST Certificate"
                      url={mediaUrls.gstCertificate}
                      mode={mode}
                    />
                    <DocumentCard
                      label="Shop Image"
                      url={mediaUrls.outletImage}
                      mode={mode}
                    />
                    <DocumentCard
                      label="Passbook"
                      url={mediaUrls.passbookImage}
                      mode={mode}
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
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Close
                    </Button>
                    {step < STEPS.length ? (
                      <Button type="button" onClick={goNext}>
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : isEdit ? (
                      <Button
                        type="button"
                        onClick={() => void save()}
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
