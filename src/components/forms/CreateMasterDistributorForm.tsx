"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { masterDistributorSchema, MasterDistributorFormData } from "@/validations";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Textarea } from "@/components/common/Textarea";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Stepper } from "@/components/common/Stepper";
import { FileUpload } from "@/components/common/FileUpload";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { useRoleAccess } from "@/hooks/useAuth";
import { registerMasterDistributor } from "@/store/api/adminModuleApi";

const STEPS = [
  { id: "personal", label: "Personal Details", description: "Basic information" },
  { id: "outlet", label: "Outlet Details", description: "Business location" },
  { id: "kyc", label: "KYC Details", description: "Identity verification" },
  { id: "bank", label: "Bank Details", description: "Payment information" },
];

export function CreateMasterDistributorForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const dispatch = useAppDispatch();
  const { isAdminApiAuth } = useRoleAccess();
  const { createMasterDistributorLoading } = useAppSelector(
    (state) => state.adminModule
  );

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    formState: { errors },
  } = useForm<MasterDistributorFormData>({
    resolver: zodResolver(masterDistributorSchema),
    mode: "onChange",
  });

  const stepFields: (keyof MasterDistributorFormData)[][] = [
    ["firstName", "lastName", "email", "mobile", "dateOfBirth", "gender"],
    ["outletName", "outletAddress", "city", "state", "pincode"],
    ["aadhaarNumber", "panNumber"],
    ["accountHolderName", "accountNumber", "ifscCode", "bankName"],
  ];

  const nextStep = async () => {
    const valid = await trigger(stepFields[currentStep]);
    if (valid) setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data: MasterDistributorFormData) => {
    if (isAdminApiAuth) {
      const result = await dispatch(registerMasterDistributor(data));
      if (registerMasterDistributor.fulfilled.match(result)) {
        toast.success("Master Distributor created successfully");
        reset();
        setCurrentStep(0);
      } else {
        toast.error(
          (result.payload as string) || "Failed to create master distributor"
        );
      }
      return;
    }
    toast.success("Master Distributor registration submitted (UI preview)");
    reset();
    setCurrentStep(0);
  };

  return (
    <div className="space-y-8">
      <Stepper steps={STEPS} currentStep={currentStep} />

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {currentStep === 0 && (
              <Card>
                <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_280px]">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="First Name" error={errors.firstName?.message} {...register("firstName")} />
                    <Input label="Last Name" error={errors.lastName?.message} {...register("lastName")} />
                    <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
                    <Input label="Mobile" error={errors.mobile?.message} {...register("mobile")} />
                    <Input label="Date of Birth" type="date" error={errors.dateOfBirth?.message} {...register("dateOfBirth")} />
                    <Select
                      label="Gender"
                      options={[
                        { value: "", label: "Select gender" },
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                        { value: "other", label: "Other" },
                      ]}
                      error={errors.gender?.message}
                      {...register("gender")}
                    />
                  </div>
                  <FileUpload label="Profile Image" accept="image/*" hint="JPG, PNG up to 5MB" />
                </div>
              </Card>
            )}

            {currentStep === 1 && (
              <Card>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Outlet / Shop Name" error={errors.outletName?.message} {...register("outletName")} />
                  <Input label="City" error={errors.city?.message} {...register("city")} />
                  <Input label="State" error={errors.state?.message} {...register("state")} />
                  <Input label="Pincode" error={errors.pincode?.message} {...register("pincode")} />
                  <div className="sm:col-span-2">
                    <Textarea label="Outlet Address" error={errors.outletAddress?.message} {...register("outletAddress")} />
                  </div>
                </div>
              </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                  <Input label="Aadhaar Number" placeholder="XXXX XXXX XXXX" error={errors.aadhaarNumber?.message} {...register("aadhaarNumber")} />
                  <Input label="PAN Number" placeholder="ABCDE1234F" error={errors.panNumber?.message} {...register("panNumber")} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FileUpload label="Aadhaar Front" accept="image/*" hint="Clear photo of front side" />
                  <FileUpload label="Aadhaar Back" accept="image/*" hint="Clear photo of back side" />
                  <FileUpload label="PAN Card" accept="image/*" hint="PAN card scan or photo" />
                  <FileUpload label="Owner Photo" accept="image/*" hint="Passport size photo" />
                  <FileUpload label="Video Verification" accept="video/*" type="video" hint="Short verification video" />
                </div>
              </Card>
            )}

            {currentStep === 3 && (
              <Card>
                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                  <Input label="Account Holder Name" error={errors.accountHolderName?.message} {...register("accountHolderName")} />
                  <Input label="Account Number" error={errors.accountNumber?.message} {...register("accountNumber")} />
                  <Input label="IFSC Code" placeholder="SBIN0001234" error={errors.ifscCode?.message} {...register("ifscCode")} />
                  <Input label="Bank Name" error={errors.bankName?.message} {...register("bankName")} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FileUpload label="Passbook" accept="image/*,.pdf" type="document" hint="First page of passbook" />
                  <FileUpload label="Cancelled Cheque" accept="image/*" hint="Clear cheque image" />
                  <FileUpload label="Bank Statement" accept="image/*,.pdf" type="document" hint="Recent bank statement" />
                </div>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button type="button" onClick={nextStep}>
              Next Step
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              isLoading={isAdminApiAuth && createMasterDistributorLoading}
              disabled={isAdminApiAuth && createMasterDistributorLoading}
            >
              <CheckCircle2 className="h-4 w-4" />
              Submit Registration
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
