import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  variant?: "default" | "dark";
  /** Show eye toggle for password fields */
  revealable?: boolean;
}

export function Input({
  label,
  error,
  icon,
  variant = "default",
  revealable = false,
  className,
  type,
  ...props
}: InputProps) {
  const isDark = variant === "dark";
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const showToggle = revealable && isPassword;
  const inputType = showToggle ? (visible ? "text" : "password") : type;

  return (
    <div className="w-full">
      {label && (
        <label
          className={cn(
            "mb-1.5 block text-sm font-medium",
            isDark ? "text-slate-300" : "text-foreground"
          )}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2",
              isDark ? "text-slate-500" : "text-muted"
            )}
          >
            {icon}
          </div>
        )}
        <input
          type={inputType}
          className={cn(
            "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground shadow-sm outline-none transition-all placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/30",
            icon && "pl-10",
            showToggle && "pr-11",
            error &&
              "border-accent-red focus:border-accent-red focus:ring-accent-red/20",
            className
          )}
          {...props}
        />
        {showToggle ? (
          <button
            type="button"
            onClick={() => setVisible((prev) => !prev)}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors",
              isDark
                ? "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                : "text-muted hover:bg-primary/10 hover:text-primary"
            )}
            aria-label={visible ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {visible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>
      {error && <p className="mt-1 text-xs text-accent-red">{error}</p>}
    </div>
  );
}
