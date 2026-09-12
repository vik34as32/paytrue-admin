"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { State } from "country-state-city";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { Modal } from "@/components/modals/Modal";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { Select } from "@/components/common/Select";
import { ImageUpload } from "@/components/common/ImageUpload";
import { VideoUpload } from "@/components/common/VideoUpload";
import { BankLogoGrid } from "@/components/common/BankLogoGrid";
import { VerificationCard } from "@/components/verification/VerificationCard";
import {
  mapApiUserToExistingUrls,
  splitFullName,
} from "@/lib/buildUserFormData";
import { formatUserTypeLabel, getNetworkUserName } from "@/lib/normalizeUser";
import { cn, resolveMediaUrl } from "@/lib/utils";
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
import { getGenderLabel, toApiGender } from "@/constants/gender";
import { resolveBankNameFromIfsc } from "@/constants/indianBanks";

const STEPS = [
  { id: 1, title: "Edit Profile" },
  { id: 2, title: "Outlet Information" },
  { id: 3, title: "KYC Documents" },
  { id: 4, title: "Bank Details" },
  { id: 5, title: "Preview & Submit" },
] as const;

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "PENDING", label: "Pending" },
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

function LockedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
      <Check className="h-3 w-3" />
      Locked
    </span>
  );
}

function PreviewSection({
  title,
  items,
  onEdit,
}: {
  title: string;
  items: [string, string | undefined][];
  onEdit?: () => void;
}) {
  return (
    <div className="rounded-xl bg-slate-500 p-5 text-white shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-white">{title}</h4>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="text-sm font-semibold text-sky-300 transition hover:text-sky-200"
          >
            Edit
          </button>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs font-medium text-slate-200/80">{label}</p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {value || "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
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
  const [fullName, setFullName] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [confirmAccountError, setConfirmAccountError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const isEdit = mode === "edit";
  const isView = mode === "view";

  const methods = useForm<NetworkUserEditValues>({
    resolver: zodResolver(networkUserEditSchema),
    defaultValues: networkUserEditEmptyDefaults,
    mode: "onBlur",
  });

  const { reset, watch, handleSubmit, setValue, formState, control, register, getValues } =
    methods;
  const values = watch();
  const selectedState = watch("state");
  const ifscCode = watch("ifscCode") || "";
  const states = useMemo(() => State.getStatesOfCountry("IN"), []);

  const mediaUrls = useMemo(() => {
    if (!user) {
      return {} as Partial<Record<UserFileFieldKey, string | null>>;
    }
    const urls = mapApiUserToExistingUrls(user);
    const resolved: Partial<Record<UserFileFieldKey, string | null>> = {};
    (Object.keys(USER_FILE_FIELDS) as UserFileFieldKey[]).forEach((key) => {
      resolved[key] = resolveMediaUrl(urls[key] || null);
    });
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
    setFullName(
      [mapped.firstName, mapped.lastName].filter(Boolean).join(" ").trim()
    );
    setConfirmAccountNumber(mapped.accountNumber || "");
    setConfirmAccountError("");
  }, [isOpen, user, reset]);

  useEffect(() => {
    const bankName = resolveBankNameFromIfsc(ifscCode);
    if (!bankName || isView) return;
    if ((getValues("bankName") || "") === bankName) return;
    setValue("bankName", bankName, { shouldValidate: true, shouldDirty: true });
  }, [ifscCode, getValues, setValue, isView]);

  const captureLocation = useCallback(
    (opts?: { silent?: boolean }) => {
      if (isView) return;
      if (!navigator.geolocation) {
        if (!opts?.silent) {
          toast.error("Geolocation is not supported by this browser");
        }
        return;
      }
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue("latitude", position.coords.latitude.toFixed(6), {
            shouldDirty: true,
          });
          setValue("longitude", position.coords.longitude.toFixed(6), {
            shouldDirty: true,
          });
          setLocationLoading(false);
          if (!opts?.silent) toast.success("Location updated");
        },
        (error) => {
          console.error("Location error:", error);
          setLocationLoading(false);
          if (!opts?.silent) toast.error("Unable to fetch current location");
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    },
    [setValue, isView]
  );

  const setFile = (field: UserFileFieldKey, file: File | null) => {
    if (isView) return;
    setValue(field, file, { shouldDirty: true, shouldTouch: true });
  };

  const goNext = () => {
    if (step === 4 && isEdit) {
      const account = (getValues("accountNumber") || "").trim();
      if (confirmAccountNumber.trim() !== account) {
        setConfirmAccountError("Account numbers do not match");
        toast.error("Confirm account number must match");
        return;
      }
      setConfirmAccountError("");
    }
    setStep((s) => Math.min(STEPS.length, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const save = handleSubmit(async (data) => {
    if (!onSubmit || !isEdit) return;
    if (confirmAccountNumber.trim() !== (data.accountNumber || "").trim()) {
      setConfirmAccountError("Account numbers do not match");
      setStep(4);
      toast.error("Confirm account number must match");
      return;
    }
    const ok = await onSubmit({
      ...data,
      gender: toApiGender(data.gender) || "",
      password: "",
    });
    if (ok) onClose();
  });

  const stateLabel =
    states.find((state) => state.isoCode === values.state)?.name || values.state;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Profile" : "View Profile"}
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
          {isView ? (
            <VerificationCard
              userId={user.id}
              userName={getNetworkUserName(user)}
              fallbackStatus={
                typeof (user as Record<string, unknown>).verificationStatus ===
                "string"
                  ? String(
                      (user as Record<string, unknown>).verificationStatus
                    )
                  : null
              }
              canManage
            />
          ) : null}

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
                  isView ? " · View only" : ""
                }`}
              />

              <div className="space-y-6">
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="w-full">
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Full Name
                      </label>
                      <input
                        type="text"
                        disabled={isView}
                        value={fullName}
                        onChange={(e) => {
                          const next = e.target.value;
                          setFullName(next);
                          const split = splitFullName(next);
                          setValue("firstName", split.firstName, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                          setValue("lastName", split.lastName, {
                            shouldDirty: true,
                          });
                        }}
                        className={cn(
                          "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
                          formState.errors.firstName && "border-accent-red",
                          isView && "cursor-not-allowed opacity-70"
                        )}
                        placeholder="Enter full name"
                      />
                      {formState.errors.firstName?.message ? (
                        <p className="mt-1 text-xs text-accent-red">
                          {formState.errors.firstName.message}
                        </p>
                      ) : null}
                    </div>

                    <div className="w-full">
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <input
                          type="email"
                          disabled
                          value={values.email || ""}
                          className="w-full cursor-not-allowed rounded-xl border border-border bg-card py-2.5 pl-10 pr-24 text-sm text-muted outline-none"
                          readOnly
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <LockedBadge />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="w-full">
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                          Mobile
                        </label>
                        <div className="relative">
                          <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                          <input
                            type="text"
                            disabled
                            value={values.mobile || ""}
                            className="w-full cursor-not-allowed rounded-xl border border-border bg-card py-2.5 pl-10 pr-24 text-sm text-muted outline-none"
                            readOnly
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <LockedBadge />
                          </div>
                        </div>
                      </div>

                      <Select
                        label="Gender"
                        disabled={isView}
                        value={toApiGender(values.gender) || ""}
                        onChange={(e) =>
                          setValue(
                            "gender",
                            (toApiGender(e.target.value) ||
                              "") as NetworkUserEditValues["gender"],
                            { shouldDirty: true, shouldValidate: true }
                          )
                        }
                        options={[
                          { value: "", label: "Select gender" },
                          { value: "M", label: "Male" },
                          { value: "F", label: "Female" },
                          { value: "T", label: "Other" },
                        ]}
                      />
                    </div>

                    <div className="w-full">
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Date of Birth
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          disabled={isView}
                          value={
                            /^\d{4}-\d{2}-\d{2}/.test(values.dateOfBirth || "")
                              ? String(values.dateOfBirth).slice(0, 10)
                              : ""
                          }
                          onChange={(e) =>
                            setValue("dateOfBirth", e.target.value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                          className={cn(
                            "w-full rounded-xl border border-border bg-card px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
                            isView && "cursor-not-allowed opacity-70"
                          )}
                        />
                        <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      </div>
                    </div>

                    {isEdit ? (
                      <Select
                        label="Status"
                        value={values.status || ""}
                        onChange={(e) =>
                          setValue(
                            "status",
                            e.target.value as NetworkUserEditValues["status"]
                          )
                        }
                        options={[
                          { value: "", label: "Select status" },
                          ...STATUS_OPTIONS,
                        ]}
                      />
                    ) : null}

                    <ImageUpload
                      label="Profile Image"
                      size="tall"
                      file={values.profileImage}
                      existingUrl={mediaUrls.profileImage}
                      onChange={(file) => setFile("profileImage", file)}
                      readOnly={isView}
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Input
                        label="Outlet Name"
                        disabled={isView}
                        error={formState.errors.outletName?.message}
                        {...register("outletName")}
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
                        placeholder="Optional"
                        {...register("gstNumber")}
                      />
                      <Input
                        label="Address"
                        disabled={isView}
                        error={formState.errors.address?.message}
                        {...register("address")}
                      />
                      <Input
                        label="Pincode"
                        disabled={isView}
                        {...register("pincode")}
                      />
                      <Select
                        label="State"
                        disabled={isView}
                        value={selectedState}
                        onChange={(e) => {
                          setValue("state", e.target.value, {
                            shouldValidate: true,
                          });
                          setValue("city", "");
                          setValue("district", "");
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
                        label="City"
                        disabled={isView}
                        error={formState.errors.city?.message}
                        {...register("city")}
                      />
                      <Input
                        label="District"
                        disabled={isView}
                        {...register("district")}
                      />
                      <Input
                        label="Village"
                        disabled={isView}
                        placeholder="Optional"
                        {...register("village")}
                      />
                    </div>

                    <div className="flex flex-col gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="flex items-start gap-2 text-sm text-sky-800">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                        Latitude &amp; longitude are captured from your current
                        GPS location.
                      </p>
                      {isEdit ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0 border-sky-300 bg-white text-sky-700 hover:bg-sky-100"
                          onClick={() => captureLocation()}
                          disabled={locationLoading}
                        >
                          <RefreshCw
                            className={cn(
                              "h-4 w-4",
                              locationLoading && "animate-spin"
                            )}
                          />
                          Refresh Current Location
                        </Button>
                      ) : null}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="w-full">
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                          Latitude
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          disabled={isView}
                          value={values.latitude || ""}
                          placeholder="e.g. 29.418784"
                          onChange={(e) =>
                            setValue("latitude", e.target.value, {
                              shouldDirty: true,
                            })
                          }
                          className={cn(
                            "w-full rounded-xl border px-4 py-2.5 text-sm font-medium outline-none transition focus:ring-2",
                            isView
                              ? "cursor-not-allowed border-slate-600 bg-slate-600 text-white opacity-80"
                              : "border-border bg-card text-foreground focus:border-primary focus:ring-primary/20"
                          )}
                        />
                      </div>
                      <div className="w-full">
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                          Longitude
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          disabled={isView}
                          value={values.longitude || ""}
                          placeholder="e.g. 76.989476"
                          onChange={(e) =>
                            setValue("longitude", e.target.value, {
                              shouldDirty: true,
                            })
                          }
                          className={cn(
                            "w-full rounded-xl border px-4 py-2.5 text-sm font-medium outline-none transition focus:ring-2",
                            isView
                              ? "cursor-not-allowed border-slate-600 bg-slate-600 text-white opacity-80"
                              : "border-border bg-card text-foreground focus:border-primary focus:ring-primary/20"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-2">
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
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <ImageUpload
                        label="Aadhaar Front"
                        file={values.aadhaarFront}
                        existingUrl={mediaUrls.aadhaarFront}
                        onChange={(file) => setFile("aadhaarFront", file)}
                        readOnly={isView}
                      />
                      <ImageUpload
                        label="Aadhaar Back"
                        file={values.aadhaarBack}
                        existingUrl={mediaUrls.aadhaarBack}
                        onChange={(file) => setFile("aadhaarBack", file)}
                        readOnly={isView}
                      />
                      <ImageUpload
                        label="PAN Card"
                        file={values.panCard}
                        existingUrl={mediaUrls.panCard}
                        onChange={(file) => setFile("panCard", file)}
                        readOnly={isView}
                      />
                      <ImageUpload
                        label="Owner Photo"
                        file={values.ownerPhoto}
                        existingUrl={mediaUrls.ownerPhoto}
                        onChange={(file) => setFile("ownerPhoto", file)}
                        readOnly={isView}
                      />
                    </div>

                    {isView ? (
                      mediaUrls.videoVerification ? (
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-muted">
                            Video Verification
                          </label>
                          <div className="overflow-hidden rounded-xl bg-[#1e293b]">
                            <video
                              src={mediaUrls.videoVerification}
                              controls
                              className="aspect-video w-full object-contain"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted">
                          Video Verification: Not uploaded
                        </p>
                      )
                    ) : (
                      <VideoUpload
                        label="Video Verification"
                        optional
                        file={values.videoVerification}
                        existingUrl={mediaUrls.videoVerification || undefined}
                        onChange={(file) => setFile("videoVerification", file)}
                      />
                    )}
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Input
                        label="Account Holder Name"
                        disabled={isView}
                        {...register("accountHolderName")}
                      />
                      <Input
                        label="Bank Name"
                        disabled={isView}
                        {...register("bankName")}
                      />
                      <Input
                        label="Account Number"
                        disabled={isView}
                        {...register("accountNumber")}
                      />
                      <div className="w-full">
                        <Input
                          label="Confirm Account Number"
                          disabled={isView}
                          value={confirmAccountNumber}
                          error={confirmAccountError || undefined}
                          onChange={(e) => {
                            setConfirmAccountNumber(e.target.value);
                            setConfirmAccountError("");
                          }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Input
                          label="IFSC Code"
                          disabled={isView}
                          value={ifscCode}
                          maxLength={11}
                          autoCapitalize="characters"
                          onChange={(e) => {
                            const next = e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9]/g, "")
                              .slice(0, 11);
                            setValue("ifscCode", next, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }}
                        />
                        <p className="text-[11px] text-muted">
                          Bank selects automatically from IFSC
                        </p>
                      </div>
                      {!isView ? (
                        <BankLogoGrid
                          value={values.bankName || ""}
                          onChange={(bankName) =>
                            setValue("bankName", bankName, {
                              shouldValidate: true,
                            })
                          }
                        />
                      ) : null}
                    </div>

                    <div className="grid gap-6">
                      <ImageUpload
                        label="Passbook Image"
                        optional
                        size="tall"
                        file={values.passbookImage}
                        existingUrl={mediaUrls.passbookImage}
                        onChange={(file) => setFile("passbookImage", file)}
                        readOnly={isView}
                      />
                      <ImageUpload
                        label="Cancelled Cheque"
                        optional
                        size="tall"
                        file={values.cancelledChequeImage}
                        existingUrl={mediaUrls.cancelledChequeImage}
                        onChange={(file) =>
                          setFile("cancelledChequeImage", file)
                        }
                        readOnly={isView}
                      />
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-4">
                    <PreviewSection
                      title="Personal Details"
                      onEdit={isEdit ? () => setStep(1) : undefined}
                      items={[
                        ["Name", fullName || getNetworkUserName(user)],
                        [
                          "Email",
                          values.email
                            ? `${values.email}${
                                user.isEmailVerified ? " (Verified)" : ""
                              }`
                            : "—",
                        ],
                        [
                          "Mobile",
                          values.mobile
                            ? `${values.mobile}${
                                user.mobileVerified ? " (Verified)" : ""
                              }`
                            : "—",
                        ],
                        ["Gender", getGenderLabel(values.gender)],
                        ["Date of Birth", values.dateOfBirth || "—"],
                      ]}
                    />
                    <PreviewSection
                      title="Outlet Information"
                      onEdit={isEdit ? () => setStep(2) : undefined}
                      items={[
                        ["Outlet", values.outletName],
                        ["Business Type", values.businessType],
                        ["GST", values.gstNumber],
                        ["Address", values.address],
                        ["City", values.city],
                        ["State", stateLabel],
                        ["Pincode", values.pincode],
                        ["Latitude", values.latitude],
                        ["Longitude", values.longitude],
                      ]}
                    />
                    <PreviewSection
                      title="KYC"
                      onEdit={isEdit ? () => setStep(3) : undefined}
                      items={[
                        ["AADHAAR", values.aadhaarNumber],
                        ["PAN", values.panNumber],
                      ]}
                    />
                    <PreviewSection
                      title="Bank Details"
                      onEdit={isEdit ? () => setStep(4) : undefined}
                      items={[
                        ["Account Holder", values.accountHolderName],
                        ["Bank", values.bankName],
                        ["Account Number", values.accountNumber],
                        ["IFSC", values.ifscCode],
                      ]}
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    disabled={step === 1 || isSubmitting}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
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
