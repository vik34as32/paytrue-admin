import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  variant?: "default" | "dark";
}

export function Input({ label, error, icon, variant = "default", className, ...props }: InputProps) {
  const isDark = variant === "dark";
  return (
    <div className="w-full">
      {label && (
        <label className={cn("mb-1.5 block text-sm font-medium", isDark ? "text-slate-300" : "text-foreground")}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className={cn("absolute left-3 top-1/2 -translate-y-1/2", isDark ? "text-slate-500" : "text-muted")}>
            {icon}
          </div>
        )}
        <input
          className={cn(
            "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground shadow-sm outline-none transition-all placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/30",
            icon && "pl-10",
            error && "border-accent-red focus:border-accent-red focus:ring-accent-red/20",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-accent-red">{error}</p>}
    </div>
  );
}
