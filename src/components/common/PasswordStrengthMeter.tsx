"use client";

import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password?: string;
  className?: string;
}

function getStrength(password: string) {
  if (!password) return { score: 0, label: "Enter a password" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score: 1, label: "Weak" };
  if (score === 3 || score === 4) return { score: 2, label: "Medium" };
  return { score: 3, label: "Strong" };
}

export function PasswordStrengthMeter({
  password = "",
  className,
}: PasswordStrengthMeterProps) {
  const { score, label } = getStrength(password);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-1">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              score >= level ? "bg-primary" : "bg-border"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted">Password strength: {label}</p>
    </div>
  );
}
