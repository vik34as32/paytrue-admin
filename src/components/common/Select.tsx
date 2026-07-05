import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
     <div className="relative">
  <select
    className={cn(
      "w-full appearance-none rounded-xl border border-border bg-card px-4 py-2.5 pr-10 text-sm text-foreground shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/30 cursor-pointer",
      error && "border-accent-red",
      className
    )}
    {...props}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>

  <ChevronDown
    className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
  />
</div>
      {error && <p className="mt-1 text-xs text-accent-red">{error}</p>}
    </div>
  );
}
