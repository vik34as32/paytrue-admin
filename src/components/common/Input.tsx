import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </div>
        )}
        <input
          className={cn(
            "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20",
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
