import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full resize-none rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20",
          error && "border-accent-red focus:border-accent-red focus:ring-accent-red/20",
          className
        )}
        rows={3}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-accent-red">{error}</p>}
    </div>
  );
}
