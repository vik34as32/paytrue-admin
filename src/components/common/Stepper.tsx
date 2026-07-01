"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="hidden md:flex md:items-center md:justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.05 : 1,
                    backgroundColor: isCompleted
                      ? "var(--primary)"
                      : isCurrent
                        ? "var(--primary)"
                        : "var(--border)",
                  }}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors",
                    isCompleted || isCurrent
                      ? "text-white shadow-lg shadow-primary/30"
                      : "text-muted"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </motion.div>
                <p
                  className={cn(
                    "mt-2 text-xs font-semibold",
                    isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted"
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="mt-0.5 hidden text-center text-[10px] text-muted lg:block">
                    {step.description}
                  </p>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className="mx-2 mb-6 h-0.5 flex-1">
                  <div
                    className={cn(
                      "h-full rounded-full transition-colors",
                      index < currentStep ? "bg-primary" : "bg-border"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="md:hidden">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-primary">{steps[currentStep]?.label}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}
