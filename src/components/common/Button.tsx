import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const variants = {
  primary:
    "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:-translate-y-px active:scale-[0.98]",
  secondary:
    "bg-secondary text-white shadow-lg shadow-secondary/20 hover:bg-secondary/90 hover:-translate-y-px active:scale-[0.98]",
  outline:
    "border border-border bg-card text-foreground shadow-sm hover:border-primary/35 hover:bg-primary/5 hover:text-primary hover:-translate-y-px hover:shadow-md active:scale-[0.98]",
  ghost:
    "text-muted hover:text-primary hover:bg-primary/8 active:scale-[0.98]",
  danger:
    "bg-accent-red text-white shadow-lg shadow-accent-red/20 hover:bg-accent-red/90 hover:-translate-y-px active:scale-[0.98]",
};

const sizes = {
  sm: "h-9 px-3.5 text-xs rounded-xl font-semibold",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
